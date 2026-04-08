import { describe, expect, it } from 'bun:test'
import { getControllerMeta, setHandlerMetadata } from '.././route-metadata'

describe('getControllerMeta()', () => {
  it('initialises __meta with empty routes if absent', () => {
    class Fresh {}
    const meta = getControllerMeta(Fresh)

    expect(meta).toEqual({ routes: {} })
    expect((Fresh as any).__meta).toBe(meta)
  })

  it('returns existing __meta if already set', () => {
    class Existing {}
    ;(Existing as any).__meta = { path: '/items', routes: { list: { method: 'get' } } }

    const meta = getControllerMeta(Existing)
    expect(meta.path).toBe('/items')
    expect(meta.routes.list.method).toBe('get')
  })
})

describe('setHandlerMetadata()', () => {
  it('creates route entry for a new handler', () => {
    class Ctrl {}
    setHandlerMetadata(Ctrl, 'getAll', { method: 'get', path: '/' })

    const meta = getControllerMeta(Ctrl)
    expect(meta.routes.getAll).toEqual({ method: 'get', path: '/' })
  })

  it('merges data into an existing route entry', () => {
    class Ctrl {}
    setHandlerMetadata(Ctrl, 'create', { method: 'post', path: '/' })
    setHandlerMetadata(Ctrl, 'create', { raw: true })

    const meta = getControllerMeta(Ctrl)
    expect(meta.routes.create).toEqual({ method: 'post', path: '/', raw: true })
  })

  it('handles multiple handlers on the same controller', () => {
    class Ctrl {}
    setHandlerMetadata(Ctrl, 'list', { method: 'get', path: '/' })
    setHandlerMetadata(Ctrl, 'create', { method: 'post', path: '/' })

    const meta = getControllerMeta(Ctrl)
    expect(Object.keys(meta.routes)).toHaveLength(2)
  })
})
