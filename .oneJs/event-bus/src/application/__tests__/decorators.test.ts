import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { DomainEvent } from '../../domain/events/domain-events'
import { clearEventHandlers, getAllEventHandlers } from '../../domain/store'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockMarkAs = mock(() => {})
const mockLogger = {
  debug: mock(() => {}),
  info: mock(() => {}),
  warn: mock(() => {}),
  error: mock(() => {}),
}

mock.module('@OneJs/core', () => ({
  markAs: mockMarkAs,
  logger: mockLogger,
}))

const { EventHandler } = await import('../decorators')

// ── Fixtures ─────────────────────────────────────────────────────────────────

class OrderCreatedEvent extends DomainEvent {
  constructor(public readonly orderId: string) {
    super()
  }
}

class PlainClass {}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('EventHandler decorator', () => {
  beforeEach(() => {
    clearEventHandlers()
    mockMarkAs.mockClear()
    mockLogger.warn.mockClear()
  })

  afterEach(() => {
    clearEventHandlers()
  })

  describe('registration', () => {
    test('registers the handler in the event store', () => {
      class OrderHandler {
        @EventHandler(OrderCreatedEvent)
        handle(_event: OrderCreatedEvent) {}
      }

      const handlers = getAllEventHandlers()
      expect(handlers.some((h) => h.target === OrderHandler)).toBe(true)
    })

    test('stores the correct eventType name', () => {
      class OrderHandler {
        @EventHandler(OrderCreatedEvent)
        onOrder(_event: OrderCreatedEvent) {}
      }

      const entry = getAllEventHandlers().find((h) => h.target === OrderHandler)
      expect(entry!.eventType).toBe('OrderCreatedEvent')
    })

    test('stores the correct methodName', () => {
      class OrderHandler {
        @EventHandler(OrderCreatedEvent)
        onOrderCreated(_event: OrderCreatedEvent) {}
      }

      const entry = getAllEventHandlers().find(
        (h) => h.methodName === 'onOrderCreated',
      )
      expect(entry).toBeDefined()
    })

    test('passes options to the store', () => {
      class PriorityHandler {
        @EventHandler(OrderCreatedEvent, { priority: 5 })
        handle(_event: OrderCreatedEvent) {}
      }

      const entry = getAllEventHandlers().find(
        (h) => h.target === PriorityHandler,
      )
      expect(entry!.options).toEqual({ priority: 5 })
    })

    test('uses empty options when not provided', () => {
      class DefaultHandler {
        @EventHandler(OrderCreatedEvent)
        handle(_event: OrderCreatedEvent) {}
      }

      const entry = getAllEventHandlers().find(
        (h) => h.target === DefaultHandler,
      )
      expect(entry!.options).toEqual({})
    })
  })

  describe('markAs', () => {
    test('marks the class as handler role', () => {
      class MarkedHandler {
        @EventHandler(OrderCreatedEvent)
        handle(_event: OrderCreatedEvent) {}
      }

      expect(mockMarkAs).toHaveBeenCalledWith(MarkedHandler, 'handler')
    })
  })

  describe('invalid eventType warning', () => {
    test('logs a warning when the eventType is not a DomainEvent subclass', () => {
      class InvalidHandler {
        @EventHandler(PlainClass as any)
        handle() {}
      }

      expect(mockLogger.warn).toHaveBeenCalledTimes(1)
    })

    test('still registers the handler even with invalid eventType', () => {
      class FaultHandler {
        @EventHandler(PlainClass as any)
        handle() {}
      }

      const entry = getAllEventHandlers().find((h) => h.target === FaultHandler)
      expect(entry).toBeDefined()
    })
  })

  describe('descriptor', () => {
    test('returns the original method descriptor', () => {
      class Handler {
        @EventHandler(OrderCreatedEvent)
        handle() {
          return 'result'
        }
      }

      expect(new Handler().handle()).toBe('result')
    })
  })
})
