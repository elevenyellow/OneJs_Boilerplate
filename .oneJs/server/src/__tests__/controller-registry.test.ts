import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { registerController, getAllControllers, clearControllers } from '.././controller-registry'

class FakeController {}
class AnotherController {}

describe('Controller registry', () => {
  beforeEach(() => clearControllers())
  afterEach(() => clearControllers())

  it('starts empty', () => {
    expect(getAllControllers()).toHaveLength(0)
  })

  it('registers and retrieves a controller', () => {
    registerController(FakeController)
    const all = getAllControllers()

    expect(all).toHaveLength(1)
    expect(all[0]).toBe(FakeController)
  })

  it('does not duplicate the same controller', () => {
    registerController(FakeController)
    registerController(FakeController)

    expect(getAllControllers()).toHaveLength(1)
  })

  it('registers multiple distinct controllers', () => {
    registerController(FakeController)
    registerController(AnotherController)

    expect(getAllControllers()).toHaveLength(2)
  })

  it('clearControllers() empties the registry', () => {
    registerController(FakeController)
    clearControllers()

    expect(getAllControllers()).toHaveLength(0)
  })
})
