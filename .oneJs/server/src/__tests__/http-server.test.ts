import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import type { Container, Logger } from '@OneJs/core'
import { Server } from '.././http-server'
import { clearControllers, registerController } from '.././controller-registry'

class PatchController {
  static __meta = {
    path: '/tasks',
    routes: {
      complete: {
        method: 'patch',
        path: '/:id/complete',
      },
    },
  }

  complete() {
    return { ok: true }
  }
}

class InvalidMethodController {
  static __meta = {
    path: '/tasks',
    routes: {
      unsupported: {
        method: 'options',
        path: '/:id',
      },
    },
  }

  unsupported() {
    return { ok: true }
  }
}

class GetController {
  static __meta = {
    path: '/tasks',
    routes: {
      list: {
        method: 'get',
        path: '/',
      },
    },
  }

  list() {
    return [{ id: '1' }]
  }
}

describe('Server', () => {
  let server: Server
  let logger: {
    info: ReturnType<typeof mock>
    error: ReturnType<typeof mock>
    debug: ReturnType<typeof mock>
  }

  beforeEach(() => {
    clearControllers()

    logger = {
      info: mock(() => {}),
      error: mock(() => {}),
      debug: mock(() => {}),
    }

    server = new Server(logger as unknown as Logger)

    const fakeContainer = {
      get<T>(ctor: { new (): T }): T {
        return new ctor()
      },
    }

    server.setContainer(fakeContainer as unknown as Container)
    server.setPrefix('/api')
  })

  afterEach(() => {
    clearControllers()
  })

  it('registers PATCH routes', () => {
    ;(server as any).registerControllerRoutes(PatchController)

    const infoCalls = logger.info.mock.calls.map((call) => String(call[0] ?? ''))

    expect(
      infoCalls.some((message) =>
        message.includes('Registering route [PATCH] /api/tasks/:id/complete'),
      ),
    ).toBe(true)
  })

  it('skips unsupported HTTP methods', () => {
    ;(server as any).registerControllerRoutes(InvalidMethodController)

    const infoCalls = logger.info.mock.calls.map((call) => String(call[0] ?? ''))

    expect(
      infoCalls.some((message) => message.includes('Registering route [OPTIONS]')),
    ).toBe(false)
  })

  it('does not add duplicate controllers', () => {
    server.addController(GetController)
    server.addController(GetController)

    expect((server as any).controllers).toHaveLength(1)
  })

  it('does not register duplicate routes on start when controller is preloaded', () => {
    server.addController(GetController)
    registerController(GetController)

    ;(server as any).app.listen = (_port: number, cb?: () => void) => {
      cb?.()
      return (server as any).app
    }

    server.start(0)

    const infoCalls = logger.info.mock.calls.map((call) => String(call[0] ?? ''))
    const getRouteRegistrations = infoCalls.filter((message) =>
      message.includes('Registering route [GET] /api/tasks/'),
    )

    expect(getRouteRegistrations).toHaveLength(1)
  })
})
