import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { registerEventHandler, getAllEventHandlers, clearEventHandlers } from '.././store'

class FakeHandler {}

describe('Event handler store', () => {
  beforeEach(() => clearEventHandlers())
  afterEach(() => clearEventHandlers())

  it('starts empty', () => {
    expect(getAllEventHandlers()).toHaveLength(0)
  })

  it('registers and retrieves a handler entry', () => {
    registerEventHandler({
      target: FakeHandler,
      methodName: 'handle',
      eventType: 'TestEvent',
      options: {},
    })

    const all = getAllEventHandlers()
    expect(all).toHaveLength(1)
    expect(all[0].target).toBe(FakeHandler)
    expect(all[0].methodName).toBe('handle')
    expect(all[0].eventType).toBe('TestEvent')
  })

  it('accumulates multiple handlers', () => {
    registerEventHandler({ target: FakeHandler, methodName: 'a', eventType: 'EventA', options: {} })
    registerEventHandler({ target: FakeHandler, methodName: 'b', eventType: 'EventB', options: {} })

    expect(getAllEventHandlers()).toHaveLength(2)
  })

  it('clearEventHandlers() empties the store', () => {
    registerEventHandler({ target: FakeHandler, methodName: 'handle', eventType: 'X', options: {} })
    clearEventHandlers()

    expect(getAllEventHandlers()).toHaveLength(0)
  })
})
