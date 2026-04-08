import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { registerBootstrap, getAllBootstraps, clearBootstraps } from '../store'

class FakeService {}
class AnotherService {}

describe('Bootstrap store', () => {
  beforeEach(() => clearBootstraps())
  afterEach(() => clearBootstraps())

  it('starts empty', () => {
    expect(getAllBootstraps()).toHaveLength(0)
  })

  it('registers and retrieves a bootstrap entry', () => {
    registerBootstrap({ target: FakeService })
    const all = getAllBootstraps()

    expect(all).toHaveLength(1)
    expect(all[0].target).toBe(FakeService)
  })

  it('accumulates multiple entries', () => {
    registerBootstrap({ target: FakeService })
    registerBootstrap({ target: AnotherService })

    expect(getAllBootstraps()).toHaveLength(2)
  })

  it('clearBootstraps() empties the store', () => {
    registerBootstrap({ target: FakeService })
    clearBootstraps()

    expect(getAllBootstraps()).toHaveLength(0)
  })
})
