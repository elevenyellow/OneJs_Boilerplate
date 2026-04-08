import { describe, expect, it } from 'bun:test'
import { UseMiddleware } from '.././use.middleware'

function fakeMiddleware() {}

describe('@UseMiddleware() decorator', () => {
  it('attaches middleware to the handler route meta', () => {
    class Ctrl {
      @UseMiddleware(fakeMiddleware)
      create() {}
    }

    const meta = (Ctrl as any).__meta
    expect(meta.routes.create.middlewares).toEqual([fakeMiddleware])
  })

  it('stacks multiple middlewares in order', () => {
    function mw1() {}
    function mw2() {}

    class Ctrl {
      @UseMiddleware(mw1)
      @UseMiddleware(mw2)
      handler() {}
    }

    const middlewares = (Ctrl as any).__meta.routes.handler.middlewares
    expect(middlewares).toContain(mw1)
    expect(middlewares).toContain(mw2)
    expect(middlewares).toHaveLength(2)
  })

  it('initialises __meta if not present', () => {
    class Fresh {
      @UseMiddleware(fakeMiddleware)
      action() {}
    }

    expect((Fresh as any).__meta).toBeDefined()
    expect((Fresh as any).__meta.routes.action.middlewares).toHaveLength(1)
  })
})
