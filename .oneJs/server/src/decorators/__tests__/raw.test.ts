import { describe, expect, it } from 'bun:test'
import { Raw } from '.././raw'
import { getControllerMeta } from '../../utils/route-metadata'

describe('@Raw() decorator', () => {
  it('sets raw: true on the handler metadata', () => {
    class Ctrl {
      @Raw()
      upload() {}
    }

    const meta = getControllerMeta(Ctrl)
    expect(meta.routes.upload.raw).toBe(true)
  })
})
