/**
 * ServerPlugin integration tests
 *
 * Boots the OneJs kernel with a real ServerPlugin and verifies that:
 * - Server is registered in the container after startup
 * - Controllers registered via the controller registry are wired to the Server
 */
/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */

import { Container, OneJs, PluginRegistry } from '@OneJs/core'
import { beforeEach, describe, expect, it } from 'bun:test'
import { clearControllers, registerController } from '../controller-registry'
import { ServerPlugin } from '../server-plugin'

// Minimal stub that satisfies ServerPlugin's dependsOn: ['bootstrap-loader']
const stubBootstrapLoader = { name: 'bootstrap-loader', priority: 10 }

class PingController {
  static __meta = {
    path: '/ping',
    routes: {
      ping: { method: 'get', path: '/' },
    },
  }
  ping() {
    return { ok: true }
  }
}

class StatusController {
  static __meta = {
    path: '/status',
    routes: {
      get: { method: 'get', path: '/' },
    },
  }
  get() {
    return { status: 'ok' }
  }
}

describe('ServerPlugin — integration', () => {
  beforeEach(() => {
    clearControllers()
    PluginRegistry.clear()
  })

  it('registers the Server in the container after startup', async () => {
    const container = new Container()

    await new OneJs(container)
      .use(stubBootstrapLoader)
      .use(new ServerPlugin())
      .start()

    const { Server } = await import('../http-server')
    const server = container.get(Server)
    expect(server).toBeDefined()
  })

  it('Server is a singleton — same instance each time', async () => {
    const container = new Container()

    await new OneJs(container)
      .use(stubBootstrapLoader)
      .use(new ServerPlugin())
      .start()

    const { Server } = await import('../http-server')
    const serverA = container.get(Server)
    const serverB = container.get(Server)
    expect(serverA).toBe(serverB)
  })

  it('adds controllers from the registry to the Server on load', async () => {
    registerController(PingController as any)
    registerController(StatusController as any)

    const container = new Container()
    const serverPlugin = new ServerPlugin()

    await new OneJs(container)
      .use(stubBootstrapLoader)
      .use(serverPlugin)
      .start()

    const { Server } = await import('../http-server')
    const server = container.get(Server)
    // Server is created; verify controllers were added via addControllers
    // Access internal state to verify setup
    expect((server as any).controllers).toHaveLength(2)
  })

  it('leaves Server with no controllers when none are registered', async () => {
    const container = new Container()

    await new OneJs(container)
      .use(stubBootstrapLoader)
      .use(new ServerPlugin())
      .start()

    const { Server } = await import('../http-server')
    const server = container.get(Server)
    expect((server as any).controllers).toHaveLength(0)
  })

  it('completes startup without throwing when controllers list is empty', async () => {
    await expect(
      new OneJs(new Container())
        .use(stubBootstrapLoader)
        .use(new ServerPlugin())
        .start(),
    ).resolves.toBeDefined()
  })

  it('completes startup without throwing when controllers are registered', async () => {
    registerController(PingController as any)

    await expect(
      new OneJs(new Container())
        .use(stubBootstrapLoader)
        .use(new ServerPlugin())
        .start(),
    ).resolves.toBeDefined()
  })
})
