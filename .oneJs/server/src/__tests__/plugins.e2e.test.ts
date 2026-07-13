/**
 * Plugins E2E tests — ServerPlugin + EventBusPlugin
 *
 * Tests the full plugin pipeline end-to-end:
 *   OneJs kernel boots → ServerPlugin wires controllers → HTTP requests served
 *   EventBusPlugin wires event handlers → events published → handlers invoked
 *
 * Uses Elysia's internal handle() so no real TCP server is needed.
 */

import {
  Container,
  Injectable,
  Logger,
  metadataRegistry,
  OneJs,
  PluginRegistry,
} from '@OneJs/core'
import {
  DomainEvent,
  EventBus,
  EventBusPlugin,
  EventHandler,
} from '@OneJs/event-bus'
import { clearEventHandlers } from '@OneJs/event-bus/domain/store'
import { ServerPlugin } from '@OneJs/server'
import {
  clearControllers,
  registerController,
} from '@OneJs/server/controller-registry'
import { Server } from '@OneJs/server/http-server'
import { beforeEach, describe, expect, it, mock } from 'bun:test'

function restoreServerMetadata() {
  metadataRegistry.registerService(Server, 'singleton', false)
  metadataRegistry.registerParamType(Server, 0, Logger)
}

// ── Test controllers ──────────────────────────────────────────

class HealthController {
  static __meta = {
    path: '/health',
    routes: {
      check: { method: 'get', path: '/' },
    },
  }

  check() {
    return { status: 'ok' }
  }
}

class EchoController {
  static __meta = {
    path: '/echo',
    routes: {
      post: { method: 'post', path: '/' },
    },
  }

  post(ctx: any) {
    return { received: ctx.body }
  }
}

class ErrorController {
  static __meta = {
    path: '/fail',
    routes: {
      boom: { method: 'get', path: '/' },
    },
  }

  boom() {
    throw new Error('intentional error')
  }
}

// Minimal stub that satisfies ServerPlugin's dependsOn
const stubBootstrapLoader = { name: 'bootstrap-loader', priority: 10 }

const BASE = 'http://test'

function get(path: string) {
  return new Request(`${BASE}${path}`)
}

function post(path: string, body: object) {
  return new Request(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function bootServerWithControllers(
  controllers: any[],
  containerOverride?: Container,
) {
  const container = containerOverride ?? new Container()

  controllers.forEach((ctrl) => {
    registerController(ctrl)
    // Register controller in DI container so Server can resolve it
    container.register(ctrl, 'transient', false, [])
  })

  await new OneJs(container)
    .use(stubBootstrapLoader)
    .use(new ServerPlugin())
    .start()

  const server = container.get(Server)
  server.setContainer(container)

  // Override listen to avoid opening real TCP socket
  ;(server as any).app.listen = (_port: number, cb?: () => void) => {
    cb?.()
    return (server as any).app
  }

  server.setPrefix('/api').start(0)

  return { server, container, app: (server as any).app }
}

// ───────────────────────────────────────────────────────────────
describe('ServerPlugin — E2E HTTP pipeline', () => {
  beforeEach(() => {
    clearControllers()
    PluginRegistry.clear()
    restoreServerMetadata()
  })

  it('GET /api/health returns 200 with success response', async () => {
    const { app } = await bootServerWithControllers([HealthController])

    const res = await app.handle(get('/api/health/'))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('ok')
  })

  it('POST /api/echo returns the posted body', async () => {
    const { app } = await bootServerWithControllers([EchoController])

    const res = await app.handle(post('/api/echo/', { message: 'hello' }))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.received.message).toBe('hello')
  })

  it('returns 404 for unregistered routes', async () => {
    const { app } = await bootServerWithControllers([HealthController])

    const res = await app.handle(get('/api/notfound'))
    expect(res.status).toBe(404)
  })

  it('handles multiple controllers registered together', async () => {
    const { app } = await bootServerWithControllers([
      HealthController,
      EchoController,
    ])

    const healthRes = await app.handle(get('/api/health/'))
    expect(healthRes.status).toBe(200)

    const echoRes = await app.handle(post('/api/echo/', { x: 1 }))
    expect(echoRes.status).toBe(200)
  })

  it('response always wraps data in the envelope format', async () => {
    const { app } = await bootServerWithControllers([HealthController])
    const res = await app.handle(get('/api/health/'))
    const body = await res.json()

    expect(body).toHaveProperty('success')
    expect(body).toHaveProperty('data')
    expect(body).toHaveProperty('message')
    expect(body).toHaveProperty('timestamp')
    expect(typeof body.timestamp).toBe('string')
  })

  it('returns 500 when a controller throws an unhandled error', async () => {
    const { app } = await bootServerWithControllers([ErrorController])

    const res = await app.handle(get('/api/fail/'))
    expect(res.status).toBe(500)

    const body = await res.json()
    expect(body.success).toBe(false)
  })
})

// ───────────────────────────────────────────────────────────────
describe('EventBusPlugin — E2E handler wiring', () => {
  beforeEach(() => {
    clearEventHandlers()
    clearControllers()
    PluginRegistry.clear()
    restoreServerMetadata()
  })

  it('published events reach registered handlers after kernel boot', async () => {
    class PingEvent extends DomainEvent {}

    const handled = mock(() => Promise.resolve())

    @Injectable()
    class PingHandler {
      @EventHandler(PingEvent)
      async handle(event: PingEvent) {
        return handled(event)
      }
    }

    const container = new Container()

    await new OneJs(container)
      .use(stubBootstrapLoader)
      .use(new EventBusPlugin())
      .start()

    const eventBus = container.get(EventBus)
    await eventBus.publish(new PingEvent())

    expect(handled).toHaveBeenCalledTimes(1)
  })

  it('handler is not triggered for a different event type', async () => {
    class EventA extends DomainEvent {}
    class EventB extends DomainEvent {}

    const handledA = mock(() => Promise.resolve())
    const handledB = mock(() => Promise.resolve())

    @Injectable()
    class HandlerA {
      @EventHandler(EventA)
      async handle(event: EventA) {
        return handledA(event)
      }
    }

    @Injectable()
    class HandlerB {
      @EventHandler(EventB)
      async handle(event: EventB) {
        return handledB(event)
      }
    }

    const container = new Container()

    await new OneJs(container)
      .use(stubBootstrapLoader)
      .use(new EventBusPlugin())
      .start()

    const eventBus = container.get(EventBus)
    await eventBus.publish(new EventA())

    expect(handledA).toHaveBeenCalledTimes(1)
    expect(handledB).not.toHaveBeenCalled()
  })
})

// ───────────────────────────────────────────────────────────────
describe('ServerPlugin + EventBusPlugin — combined E2E', () => {
  beforeEach(() => {
    clearEventHandlers()
    clearControllers()
    PluginRegistry.clear()
    restoreServerMetadata()
  })

  it('both plugins boot together in the same kernel without conflict', async () => {
    await expect(
      new OneJs(new Container())
        .use(stubBootstrapLoader)
        .use(new ServerPlugin())
        .use(new EventBusPlugin())
        .start(),
    ).resolves.toBeDefined()
  })

  it('controller receives HTTP request and event bus dispatches event in same kernel', async () => {
    class OrderCreatedEvent extends DomainEvent {
      constructor(public readonly orderId: string) {
        super()
      }
    }

    const eventHandled = mock(() => Promise.resolve())

    @Injectable()
    class OrderEventHandler {
      @EventHandler(OrderCreatedEvent)
      async handle(event: OrderCreatedEvent) {
        return eventHandled(event)
      }
    }

    class OrderController {
      static __meta = {
        path: '/orders',
        routes: { create: { method: 'post', path: '/' } },
      }

      create() {
        return { id: 'order-1' }
      }
    }

    const container = new Container()
    registerController(OrderController)
    container.register(OrderController, 'transient', false, [])

    await new OneJs(container)
      .use(stubBootstrapLoader)
      .use(new ServerPlugin())
      .use(new EventBusPlugin())
      .start()

    const server = container.get(Server)
    server.setContainer(container)
    ;(server as any).app.listen = (_port: number, cb?: () => void) => {
      cb?.()
      return (server as any).app
    }
    server.setPrefix('/api').start(0)

    const app = (server as any).app

    const res = await app.handle(
      new Request('http://test/api/orders/', { method: 'POST' }),
    )
    expect(res.status).toBe(200)

    // Publish an event via the event bus in the same container
    const eventBus = container.get(EventBus)
    await eventBus.publish(new OrderCreatedEvent('order-1'))

    expect(eventHandled).toHaveBeenCalledTimes(1)
  })
})
