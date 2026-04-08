import { logger, type BootstrapPlugin, type Container } from '@OneJs/core'
import { EventBus } from './application/event-bus'
import { InMemoryEventPublisher } from './application/publishers/in-memory-event-publisher'
import { PUBLISHER_TOKEN } from './application/publishers/publisher-token'
import type { EventBusBridge } from './domain/interfaces/event-bus-bridge'
import type { DomainEvent } from './domain/events/domain-events'
import { getAllEventHandlers } from './domain/store'

export class EventBusPlugin implements BootstrapPlugin {
  name = 'event-bus-plugin'
  priority = 50
  dependsOn = ['bootstrap-loader']
  critical = true

  constructor(private readonly bridge?: EventBusBridge) {}

  register(container: Container): void {
    if (this.bridge) {
      container.registerInstance(PUBLISHER_TOKEN, this.bridge)
      logger.debug(
        'oneJs:event-bus',
        '📝 EventBus plugin registered (publisher: custom bridge)',
      )
    } else {
      container.registerAlias(PUBLISHER_TOKEN, InMemoryEventPublisher)
      logger.debug(
        'oneJs:event-bus',
        '📝 EventBus plugin registered (publisher: in-memory)',
      )
    }
  }

  async load(container: Container): Promise<void> {
    const handlers = getAllEventHandlers()

    if (handlers.length === 0) {
      logger.debug('oneJs:event-bus', 'No event handlers found')
      return
    }

    logger.debug(
      'oneJs:event-bus',
      `🧩 Registering ${handlers.length} event handler(s)...`,
    )

    const eventBus = container.get(EventBus)

    for (const { target, methodName, eventType, options } of handlers) {
      const handler = {
        handle: async (event: DomainEvent) => {
          const instance = container.get(target)
          return instance[methodName](event)
        },
      }

      eventBus.subscribe(eventType, handler, options)
    }

    // Init the bridge after all subscriptions are wired so that subscribe()
    // has been called for every @EventHandler — critical for subscriber bridges
    // that need the full inbound handler map before activating the connection.
    await this.bridge?.init?.(container)

    logger.debug('oneJs:event-bus', '✅ Event handlers registered')
  }
}
