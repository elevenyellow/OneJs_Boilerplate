import { logger } from '../../core/src'
import type { BootstrapPlugin, Container } from '../../core/src/bootstrap'
import { EventBus } from './application/event-bus'
import type { DomainEvent } from './domain/events/domain-events'
import { getAllEventHandlers } from './domain/store'

export class EventBusPlugin implements BootstrapPlugin {
  name = 'event-bus-plugin'
  priority = 50

  register(container: Container): void {
    // Plugin itself doesn't need to register services - decorators handle it
    // Just log plugin registration
    logger.debug('oneJs:event-bus', '📝 EventBus plugin registered')
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

    logger.debug('oneJs:event-bus', '✅ Event handlers registered')
  }
}
