import { describe, expect, it } from 'bun:test'
import { DomainEvent } from '.././domain-events'

class TestEvent extends DomainEvent {
  constructor(
    public readonly data: string,
    occurredOn?: Date,
  ) {
    super(occurredOn)
  }
}

describe('DomainEvent', () => {
  it('sets occurredOn to now by default', () => {
    const before = new Date()
    const event = new TestEvent('hello')
    const after = new Date()

    expect(event.occurredOn.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(event.occurredOn.getTime()).toBeLessThanOrEqual(after.getTime())
  })

  it('accepts a custom occurredOn date', () => {
    const custom = new Date('2024-01-01T00:00:00Z')
    const event = new TestEvent('hello', custom)

    expect(event.occurredOn).toBe(custom)
  })

  it('getOccurredOn() returns the timestamp', () => {
    const event = new TestEvent('hello')
    expect(event.getOccurredOn()).toBe(event.occurredOn)
  })

  it('subclass can carry custom payload', () => {
    const event = new TestEvent('payload-data')
    expect(event.data).toBe('payload-data')
  })
})
