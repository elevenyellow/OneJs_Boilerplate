import { describe, expect, it } from 'bun:test'
import { Middleware } from '.././middleware'

describe('@Middleware() decorator', () => {
  it('stores the decorated method name as __middlewareMethod', () => {
    class AuthMiddleware {
      @Middleware()
      handle() {}
    }

    expect((AuthMiddleware as any).__middlewareMethod).toBe('handle')
  })

  it('works on a method with a custom name', () => {
    class LogMiddleware {
      @Middleware()
      execute() {}
    }

    expect((LogMiddleware as any).__middlewareMethod).toBe('execute')
  })
})
