import { describe, expect, it } from 'bun:test'
import { Get, Post, Put, Patch, Delete } from '.././methods'
import { getControllerMeta } from '../../utils/route-metadata'

describe('HTTP method decorators', () => {
  it('@Get() sets method=get and path', () => {
    class Ctrl {
      @Get('/items')
      list() {}
    }

    const meta = getControllerMeta(Ctrl)
    expect(meta.routes.list.method).toBe('get')
    expect(meta.routes.list.path).toBe('/items')
  })

  it('@Post() sets method=post', () => {
    class Ctrl {
      @Post('/items')
      create() {}
    }

    expect(getControllerMeta(Ctrl).routes.create.method).toBe('post')
  })

  it('@Put() sets method=put', () => {
    class Ctrl {
      @Put('/items/:id')
      update() {}
    }

    expect(getControllerMeta(Ctrl).routes.update.method).toBe('put')
  })

  it('@Patch() sets method=patch', () => {
    class Ctrl {
      @Patch('/items/:id')
      patch() {}
    }

    expect(getControllerMeta(Ctrl).routes.patch.method).toBe('patch')
  })

  it('@Delete() sets method=delete', () => {
    class Ctrl {
      @Delete('/items/:id')
      remove() {}
    }

    expect(getControllerMeta(Ctrl).routes.remove.method).toBe('delete')
  })

  it('passes version through to route metadata', () => {
    class Ctrl {
      @Get('/items', 'v2')
      list() {}
    }

    expect(getControllerMeta(Ctrl).routes.list.version).toBe('/v2')
  })
})
