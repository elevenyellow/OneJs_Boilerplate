import {
  Container,
  clearMarkers,
  Injectable,
  OneJs,
  PluginRegistry,
} from '@OneJs/core'
import { AutoLoaderPlugin, BootstrapLoader } from '@OneJs/core/bootstrap'
import { clearModules, Module } from '@OneJs/core/bootstrap/module'
import {
  DomainEvent,
  EventBus,
  EventBusPlugin,
  EventHandler,
} from '@OneJs/event-bus'
import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { markAs } from '../../../core/src/markers'
import { clearEventHandlers, getAllEventHandlers } from '../domain/store'

async function startKernel(container: Container): Promise<void> {
  await new OneJs(container)
    .use(new AutoLoaderPlugin({ rootDir: import.meta.dir }))
    .use(new BootstrapLoader())
    .start()
}

describe('Module ↔ EventBus wiring', () => {
  beforeEach(() => {
    clearEventHandlers()
    clearModules()
    clearMarkers()
    PluginRegistry.clear()
  })

  it('handler receives events when imported via @Module', async () => {
    class OrderPlacedEvent extends DomainEvent {
      constructor(public readonly orderId: string) {
        super()
      }
    }

    const spy = mock(() => Promise.resolve())

    @Injectable()
    class OrderPlacedHandler {
      @EventHandler(OrderPlacedEvent)
      async handle(event: OrderPlacedEvent) {
        return spy(event)
      }
    }
    markAs(OrderPlacedHandler, 'handler')

    class _OrderModule {}
    Module({ handlers: [OrderPlacedHandler] })(_OrderModule)

    PluginRegistry.register(new EventBusPlugin())
    const container = new Container()
    container.register(OrderPlacedHandler, 'singleton', false, [])
    await startKernel(container)

    const eventBus = container.get(EventBus)
    await eventBus.publish(new OrderPlacedEvent('order-123'))

    expect(spy).toHaveBeenCalledTimes(1)
    const received = spy.mock.calls[0][0] as OrderPlacedEvent
    expect(received.orderId).toBe('order-123')
  })

  it('event is NOT received when handler is not imported (no @Module)', async () => {
    class OrderPlacedEvent extends DomainEvent {
      constructor(public readonly orderId: string) {
        super()
      }
    }

    PluginRegistry.register(new EventBusPlugin())
    const container = new Container()
    await startKernel(container)

    const eventBus = container.get(EventBus)
    await eventBus.publish(new OrderPlacedEvent('order-456'))

    expect(getAllEventHandlers()).toHaveLength(0)
  })

  it('multiple handlers from different packages all receive events via @Module', async () => {
    class PaymentReceivedEvent extends DomainEvent {
      constructor(public readonly amount: number) {
        super()
      }
    }

    const spyNotification = mock(() => Promise.resolve())
    const spyAudit = mock(() => Promise.resolve())

    @Injectable()
    class NotificationHandler {
      @EventHandler(PaymentReceivedEvent)
      async handle(event: PaymentReceivedEvent) {
        return spyNotification(event)
      }
    }

    @Injectable()
    class AuditHandler {
      @EventHandler(PaymentReceivedEvent)
      async handle(event: PaymentReceivedEvent) {
        return spyAudit(event)
      }
    }
    markAs(NotificationHandler, 'handler')
    markAs(AuditHandler, 'handler')

    class _PaymentModule {}
    Module({ handlers: [NotificationHandler, AuditHandler] })(_PaymentModule)

    PluginRegistry.register(new EventBusPlugin())
    const container = new Container()
    container.register(NotificationHandler, 'singleton', false, [])
    container.register(AuditHandler, 'singleton', false, [])
    await startKernel(container)

    const eventBus = container.get(EventBus)
    eventBus.subscribe(PaymentReceivedEvent.name, {
      handle: async (event: PaymentReceivedEvent) => spyAudit(event),
    })
    await eventBus.publish(new PaymentReceivedEvent(99.99))

    expect(spyNotification).toHaveBeenCalledTimes(1)
    expect(
      (spyNotification.mock.calls[0][0] as PaymentReceivedEvent).amount,
    ).toBe(99.99)
  })

  it('handler for a different event type is not triggered', async () => {
    class EventA extends DomainEvent {}
    class EventB extends DomainEvent {}

    const spyA = mock(() => Promise.resolve())
    const spyB = mock(() => Promise.resolve())

    @Injectable()
    class HandlerA {
      @EventHandler(EventA)
      async handle(event: EventA) {
        return spyA(event)
      }
    }

    @Injectable()
    class HandlerB {
      @EventHandler(EventB)
      async handle(event: EventB) {
        return spyB(event)
      }
    }
    markAs(HandlerA, 'handler')
    markAs(HandlerB, 'handler')

    class _MultiEventModule {}
    Module({ handlers: [HandlerA, HandlerB] })(_MultiEventModule)

    PluginRegistry.register(new EventBusPlugin())
    const container = new Container()
    container.register(HandlerA, 'singleton', false, [])
    container.register(HandlerB, 'singleton', false, [])
    await startKernel(container)

    const eventBus = container.get(EventBus)
    await eventBus.publish(new EventA())

    expect(spyA).toHaveBeenCalledTimes(1)
    expect(spyB).not.toHaveBeenCalled()
  })

  it('event from a package reaches handler wired through app module', async () => {
    const spy = mock(() => Promise.resolve())

    @Injectable()
    class TaskEventHandler {
      @EventHandler(TaskLikeEvent)
      async handle(event: TaskLikeEvent) {
        return spy(event)
      }
    }
    markAs(TaskEventHandler, 'handler')

    class _ApiTaskModule {}
    Module({ handlers: [TaskEventHandler] })(_ApiTaskModule)

    PluginRegistry.register(new EventBusPlugin())
    const container = new Container()
    container.register(TaskEventHandler, 'singleton', false, [])
    await startKernel(container)

    const eventBus = container.get(EventBus)
    const event = new TaskLikeEvent('task-1', 'Buy groceries')
    await eventBus.publish(event)

    expect(spy).toHaveBeenCalledTimes(1)
    const received = spy.mock.calls[0][0] as TaskLikeEvent
    expect(received.taskId).toBe('task-1')
    expect(received.title).toBe('Buy groceries')
  })
})

class TaskLikeEvent extends DomainEvent {
  constructor(
    public readonly taskId: string,
    public readonly title: string,
  ) {
    super()
  }
}
