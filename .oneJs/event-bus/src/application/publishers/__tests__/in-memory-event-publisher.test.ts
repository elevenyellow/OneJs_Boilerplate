import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { DomainEvent } from '../../../domain/events/domain-events'
import { InMemoryEventPublisher } from '.././in-memory-event-publisher'

class OrderCreatedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    occurredOn?: Date,
  ) {
    super(occurredOn)
  }
}

class PaymentProcessedEvent extends DomainEvent {
  constructor(public readonly amount: number) {
    super()
  }
}

describe('InMemoryEventPublisher', () => {
  let publisher: InMemoryEventPublisher

  beforeEach(() => {
    publisher = new InMemoryEventPublisher()
  })

  describe('subscribe', () => {
    test('registers a handler for an event type', async () => {
      const handler = mock(() => {})
      publisher.subscribe('OrderCreated', handler)

      await publisher.publish('OrderCreated', new OrderCreatedEvent('123'))
      expect(handler).toHaveBeenCalledTimes(1)
    })

    test('registers multiple handlers for the same event type', async () => {
      const handler1 = mock(() => {})
      const handler2 = mock(() => {})
      publisher.subscribe('OrderCreated', handler1)
      publisher.subscribe('OrderCreated', handler2)

      await publisher.publish('OrderCreated', new OrderCreatedEvent('abc'))
      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
    })

    test('handlers for different event types do not cross-fire', async () => {
      const orderHandler = mock(() => {})
      const paymentHandler = mock(() => {})
      publisher.subscribe('OrderCreated', orderHandler)
      publisher.subscribe('PaymentProcessed', paymentHandler)

      await publisher.publish('OrderCreated', new OrderCreatedEvent('x'))
      expect(orderHandler).toHaveBeenCalledTimes(1)
      expect(paymentHandler).not.toHaveBeenCalled()
    })
  })

  describe('publish', () => {
    test('calls handler with the correct event object', async () => {
      let received: DomainEvent | null = null
      publisher.subscribe('OrderCreated', (event) => {
        received = event
      })

      const event = new OrderCreatedEvent('order-99')
      await publisher.publish('OrderCreated', event)
      expect(received).toBe(event)
    })

    test('does nothing when no handlers are subscribed', async () => {
      await expect(
        publisher.publish('UnknownEvent', new OrderCreatedEvent('x')),
      ).resolves.toBeUndefined()
    })

    test('publishes to correct handler when multiple event types are registered', async () => {
      const orderHandler = mock(() => {})
      const paymentHandler = mock(() => {})
      publisher.subscribe('OrderCreated', orderHandler)
      publisher.subscribe('PaymentProcessed', paymentHandler)

      await publisher.publish(
        'PaymentProcessed',
        new PaymentProcessedEvent(100),
      )
      expect(orderHandler).not.toHaveBeenCalled()
      expect(paymentHandler).toHaveBeenCalledTimes(1)
    })

    test('calls all handlers each time publish is called', async () => {
      const handler = mock(() => {})
      publisher.subscribe('OrderCreated', handler)

      await publisher.publish('OrderCreated', new OrderCreatedEvent('a'))
      await publisher.publish('OrderCreated', new OrderCreatedEvent('b'))
      expect(handler).toHaveBeenCalledTimes(2)
    })
  })
})
