import { AuthMiddleware, Roles, UseAuth } from '@OneJs/core'
import { describe, expect, test } from 'bun:test'

describe('@UseAuth()', () => {
  test('adds AuthMiddleware to route middlewares metadata', () => {
    class TestController {
      @UseAuth()
      guarded(_ctx: any) {
        return 'ok'
      }
    }

    const meta = (TestController as any).__meta?.routes?.guarded
    expect(meta?.middlewares).toContain(AuthMiddleware)
  })

  test('does not affect routes without the decorator', () => {
    class TestController {
      @UseAuth()
      guarded() {
        return 'ok'
      }

      open() {
        return 'public'
      }
    }

    const routes = (TestController as any).__meta?.routes
    expect(routes?.guarded?.middlewares).toContain(AuthMiddleware)
    expect(routes?.open).toBeUndefined()
  })

  test('can be applied to multiple methods independently', () => {
    class TestController {
      @UseAuth()
      routeA() {
        return 'a'
      }

      @UseAuth()
      routeB() {
        return 'b'
      }
    }

    const { routeA, routeB } = (TestController as any).__meta?.routes
    expect(routeA?.middlewares).toContain(AuthMiddleware)
    expect(routeB?.middlewares).toContain(AuthMiddleware)
  })
})

describe('@Roles()', () => {
  test('sets roles on route metadata', () => {
    class TestController {
      @Roles('admin', 'staff')
      restricted() {
        return 'ok'
      }
    }

    const meta = (TestController as any).__meta?.routes?.restricted
    expect(meta?.roles).toEqual(['admin', 'staff'])
  })

  test('works with a single role', () => {
    class TestController {
      @Roles('admin')
      adminOnly() {
        return 'ok'
      }
    }

    const meta = (TestController as any).__meta?.routes?.adminOnly
    expect(meta?.roles).toEqual(['admin'])
  })

  test('@UseAuth + @Roles sets both middlewares and roles', () => {
    class TestController {
      @UseAuth()
      @Roles('admin')
      fullGuard() {
        return 'ok'
      }
    }

    const meta = (TestController as any).__meta?.routes?.fullGuard
    expect(meta?.middlewares).toContain(AuthMiddleware)
    expect(meta?.roles).toEqual(['admin'])
  })

  test('different methods can carry different role configs', () => {
    class TestController {
      @UseAuth()
      @Roles('admin')
      adminRoute() {
        return 'admin'
      }

      @UseAuth()
      @Roles('staff', 'admin')
      staffRoute() {
        return 'staff'
      }
    }

    const { adminRoute, staffRoute } = (TestController as any).__meta?.routes
    expect(adminRoute?.roles).toEqual(['admin'])
    expect(staffRoute?.roles).toEqual(['staff', 'admin'])
  })
})
