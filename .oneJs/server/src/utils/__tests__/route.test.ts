import { describe, expect, it } from 'bun:test'
import { Route } from '.././route'
import { getControllerMeta } from '.././route-metadata'

describe('Route() decorator', () => {
  it('registers method and path on the controller meta', () => {
    class Ctrl {
      @Route('get', '/items')
      list() {}
    }

    const meta = getControllerMeta(Ctrl)
    expect(meta.routes.list.method).toBe('get')
    expect(meta.routes.list.path).toBe('/items')
  })

  it('prepends / when path does not start with /', () => {
    class Ctrl {
      @Route('post', 'items')
      create() {}
    }

    const meta = getControllerMeta(Ctrl)
    expect(meta.routes.create.path).toBe('/items')
  })

  it('stores version when provided', () => {
    class Ctrl {
      @Route('get', '/items', 'v2')
      list() {}
    }

    const meta = getControllerMeta(Ctrl)
    expect(meta.routes.list.version).toBe('/v2')
  })

  it('handles version with leading slash', () => {
    class Ctrl {
      @Route('get', '/items', '/v3')
      list() {}
    }

    const meta = getControllerMeta(Ctrl)
    expect(meta.routes.list.version).toBe('/v3')
  })
})
