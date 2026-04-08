import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { EventBusPlugin } from '../event-bus-plugin'
import { clearEventHandlers, registerEventHandler } from '../domain/store'
import { EventBus } from '../application/event-bus'
import { DomainEvent } from '../domain/events/domain-events'
import type { EventBusBridge } from '../domain/interfaces/event-bus-bridge'

class TestEvent extends DomainEvent {}

function makeEventBus(): { subscribe: ReturnType<typeof mock> } {
  return { subscribe: mock(() => {}) }
}

function makeContainer(
  fakeEventBus: ReturnType<typeof makeEventBus>,
  targetInstances: Map<any, any> = new Map(),
) {
  return {
    get: mock((ctor: any) => {
      if (ctor === EventBus) return fakeEventBus
      if (targetInstances.has(ctor)) return targetInstances.get(ctor)
      throw new Error(`No service for: ${ctor?.name}`)
    }),
    registerAlias: mock(() => {}),
    registerInstance: mock(() => {}),
  }
}

function makeBridge(overrides: Partial<EventBusBridge> = {}): EventBusBridge {
  return {
    publish: mock(async () => {}),
    subscribe: mock(() => {}),
    init: mock(async () => {}),
    ...overrides,
  }
}

describe('EventBusPlugin', () => {
  beforeEach(() => {
    clearEventHandlers()
  })

  describe('metadata', () => {
    test('has correct name', () => {
      expect(new EventBusPlugin().name).toBe('event-bus-plugin')
    })

    test('has priority 50', () => {
      expect(new EventBusPlugin().priority).toBe(50)
    })

    test('is critical', () => {
      expect(new EventBusPlugin().critical).toBe(true)
    })

    test('dependsOn bootstrap-loader', () => {
      expect(new EventBusPlugin().dependsOn).toEqual(['bootstrap-loader'])
    })
  })

  describe('register()', () => {
    test('registers default InMemory alias when no bridge is provided', () => {
      const plugin = new EventBusPlugin()
      const container = makeContainer(makeEventBus())
      plugin.register(container as any)
      expect(container.registerAlias).toHaveBeenCalledTimes(1)
      expect(container.registerInstance).not.toHaveBeenCalled()
    })

    test('registers bridge instance when a bridge is provided', () => {
      const bridge = makeBridge()
      const plugin = new EventBusPlugin(bridge)
      const container = makeContainer(makeEventBus())
      plugin.register(container as any)
      expect(container.registerInstance).toHaveBeenCalledTimes(1)
      expect(container.registerAlias).not.toHaveBeenCalled()
    })
  })

  describe('load()', () => {
    test('returns early when no handlers are registered', async () => {
      const fakeEventBus = makeEventBus()
      const container = makeContainer(fakeEventBus)
      const plugin = new EventBusPlugin()

      await plugin.load(container as any)

      expect(container.get).not.toHaveBeenCalled()
      expect(fakeEventBus.subscribe).not.toHaveBeenCalled()
    })

    test('retrieves EventBus from container when handlers exist', async () => {
      class MyHandler {}
      registerEventHandler({
        target: MyHandler as any,
        methodName: 'handle',
        eventType: 'TestEvent',
        options: {},
      })

      const fakeEventBus = makeEventBus()
      const targetInstance = { handle: mock(async () => {}) }
      const container = makeContainer(
        fakeEventBus,
        new Map([[MyHandler, targetInstance]]),
      )
      const plugin = new EventBusPlugin()

      await plugin.load(container as any)

      expect(container.get).toHaveBeenCalledWith(EventBus)
    })

    test('subscribes each registered handler to the event bus', async () => {
      class HandlerA {}
      class HandlerB {}

      registerEventHandler({
        target: HandlerA as any,
        methodName: 'handle',
        eventType: 'EventA',
        options: {},
      })
      registerEventHandler({
        target: HandlerB as any,
        methodName: 'handle',
        eventType: 'EventB',
        options: { priority: 1 },
      })

      const fakeEventBus = makeEventBus()
      const instanceA = { handle: mock(async () => {}) }
      const instanceB = { handle: mock(async () => {}) }
      const container = makeContainer(
        fakeEventBus,
        new Map([
          [HandlerA, instanceA],
          [HandlerB, instanceB],
        ]),
      )
      const plugin = new EventBusPlugin()

      await plugin.load(container as any)

      expect(fakeEventBus.subscribe).toHaveBeenCalledTimes(2)
    })

    test('subscribes with correct eventType and options', async () => {
      class MyHandler {}
      const options = { priority: 5 }
      registerEventHandler({
        target: MyHandler as any,
        methodName: 'handle',
        eventType: 'TestEvent',
        options,
      })

      const fakeEventBus = makeEventBus()
      const targetInstance = { handle: mock(async () => {}) }
      const container = makeContainer(
        fakeEventBus,
        new Map([[MyHandler, targetInstance]]),
      )
      const plugin = new EventBusPlugin()

      await plugin.load(container as any)

      const [eventType, , subscribedOptions] =
        fakeEventBus.subscribe.mock.calls[0]
      expect(eventType).toBe('TestEvent')
      expect(subscribedOptions).toEqual(options)
    })

    test('calls bridge.init() after all handlers are subscribed', async () => {
      class MyHandler {}
      registerEventHandler({
        target: MyHandler as any,
        methodName: 'handle',
        eventType: 'TestEvent',
        options: {},
      })

      const bridge = makeBridge()
      const plugin = new EventBusPlugin(bridge)
      const fakeEventBus = makeEventBus()
      const container = makeContainer(
        fakeEventBus,
        new Map([[MyHandler, { handle: mock(async () => {}) }]]),
      )

      await plugin.load(container as any)

      expect(fakeEventBus.subscribe).toHaveBeenCalledTimes(1)
      expect(bridge.init).toHaveBeenCalledTimes(1)
      const subscribeOrder = (fakeEventBus.subscribe as ReturnType<typeof mock>)
        .mock.invocationCallOrder[0]
      const initOrder = (bridge.init as ReturnType<typeof mock>).mock
        .invocationCallOrder[0]
      expect(initOrder).toBeGreaterThan(subscribeOrder)
    })

    test('does not call init() when no bridge is provided', async () => {
      class MyHandler {}
      registerEventHandler({
        target: MyHandler as any,
        methodName: 'handle',
        eventType: 'TestEvent',
        options: {},
      })

      const plugin = new EventBusPlugin()
      const fakeEventBus = makeEventBus()
      const container = makeContainer(
        fakeEventBus,
        new Map([[MyHandler, { handle: mock(async () => {}) }]]),
      )

      await expect(plugin.load(container as any)).resolves.toBeUndefined()
    })

    test('wired handler delegates to the target instance method', async () => {
      class OrderHandler {}
      registerEventHandler({
        target: OrderHandler as any,
        methodName: 'onOrder',
        eventType: 'OrderPlacedEvent',
        options: {},
      })

      const fakeEventBus = makeEventBus()
      const handleSpy = mock(async () => {})
      const orderHandlerInstance = { onOrder: handleSpy }
      const container = makeContainer(
        fakeEventBus,
        new Map([[OrderHandler, orderHandlerInstance]]),
      )
      const plugin = new EventBusPlugin()

      await plugin.load(container as any)

      const [, handlerObj] = fakeEventBus.subscribe.mock.calls[0]
      const event = new TestEvent()
      await handlerObj.handle(event)

      expect(handleSpy).toHaveBeenCalledTimes(1)
      expect(handleSpy).toHaveBeenCalledWith(event)
    })

    test('wired handler resolves the target instance fresh from container each time', async () => {
      class InvoiceHandler {}
      registerEventHandler({
        target: InvoiceHandler as any,
        methodName: 'process',
        eventType: 'InvoiceCreated',
        options: {},
      })

      const processCall = mock(async () => {})
      const instance = { process: processCall }
      const fakeEventBus = makeEventBus()
      const container = makeContainer(
        fakeEventBus,
        new Map([[InvoiceHandler, instance]]),
      )

      await new EventBusPlugin().load(container as any)

      const [, handler] = fakeEventBus.subscribe.mock.calls[0]
      await handler.handle(new TestEvent())
      await handler.handle(new TestEvent())

      const invoiceGetCalls = container.get.mock.calls.filter(
        ([ctor]: [any]) => ctor === InvoiceHandler,
      )
      expect(invoiceGetCalls).toHaveLength(2)
    })
  })
})
