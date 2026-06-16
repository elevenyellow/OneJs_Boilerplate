import { describe, expect, test } from 'bun:test'

// Mock @OneJs/event-bus to prevent loading the full package
// (which has optional peer dependencies that may not exist in this context)
mock.module('@OneJs/event-bus', () => ({
  DomainEvent: class DomainEvent {
    occurredOn: Date
    constructor(occurredOn: Date = new Date()) {
      this.occurredOn = occurredOn
    }
    getOccurredOn() {
      return this.occurredOn
    }
  },
}))

import { mock } from 'bun:test'

const { RegisterWorkerEvent } = await import('../register-worker.event')
const { WorkerStartedEvent } = await import('../worker-started.event')
const { WorkerStoppedEvent } = await import('../worker-stopped.event')

// ── Fixtures ────────────────────────────────────────────────────────────────

const fakeProcessor = async () => {}
const fakeWorker = { on: () => {}, close: async () => {} } as any

// ── RegisterWorkerEvent ──────────────────────────────────────────────────────

describe('RegisterWorkerEvent', () => {
  test('stores queueName, processor and concurrency', () => {
    const event = new RegisterWorkerEvent('emails', fakeProcessor, 3)

    expect(event.queueName).toBe('emails')
    expect(event.processor).toBe(fakeProcessor)
    expect(event.concurrency).toBe(3)
  })

  test('defaults occurredOn to now when not provided', () => {
    const before = new Date()
    const event = new RegisterWorkerEvent('q', fakeProcessor, 1)
    const after = new Date()

    expect(event.occurredOn >= before).toBe(true)
    expect(event.occurredOn <= after).toBe(true)
  })

  test('accepts an explicit occurredOn date', () => {
    const date = new Date('2024-06-01T00:00:00Z')
    const event = new RegisterWorkerEvent('q', fakeProcessor, 1, date)

    expect(event.occurredOn).toEqual(date)
  })

  test('getOccurredOn() returns the date', () => {
    const date = new Date('2024-06-01T00:00:00Z')
    const event = new RegisterWorkerEvent('q', fakeProcessor, 1, date)

    expect(event.getOccurredOn()).toEqual(date)
  })
})

// ── WorkerStartedEvent ───────────────────────────────────────────────────────

describe('WorkerStartedEvent', () => {
  test('stores queueName and worker', () => {
    const event = new WorkerStartedEvent('sms', fakeWorker)

    expect(event.queueName).toBe('sms')
    expect(event.worker).toBe(fakeWorker)
  })

  test('defaults occurredOn to now when not provided', () => {
    const before = new Date()
    const event = new WorkerStartedEvent('q', fakeWorker)
    const after = new Date()

    expect(event.occurredOn >= before).toBe(true)
    expect(event.occurredOn <= after).toBe(true)
  })

  test('accepts an explicit occurredOn date', () => {
    const date = new Date('2025-01-15T12:00:00Z')
    const event = new WorkerStartedEvent('q', fakeWorker, date)

    expect(event.occurredOn).toEqual(date)
  })
})

// ── WorkerStoppedEvent ───────────────────────────────────────────────────────

describe('WorkerStoppedEvent', () => {
  test('stores queueName and worker', () => {
    const event = new WorkerStoppedEvent('reports', fakeWorker)

    expect(event.queueName).toBe('reports')
    expect(event.worker).toBe(fakeWorker)
  })

  test('defaults occurredOn to now when not provided', () => {
    const before = new Date()
    const event = new WorkerStoppedEvent('q', fakeWorker)
    const after = new Date()

    expect(event.occurredOn >= before).toBe(true)
    expect(event.occurredOn <= after).toBe(true)
  })

  test('accepts an explicit occurredOn date', () => {
    const date = new Date('2025-03-10T08:00:00Z')
    const event = new WorkerStoppedEvent('q', fakeWorker, date)

    expect(event.occurredOn).toEqual(date)
  })
})
