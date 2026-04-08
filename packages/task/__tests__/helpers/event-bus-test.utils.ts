import { ConfigService, Logger } from '@OneJs/core'
import { EventBus } from '@OneJs/event-bus'
import { InMemoryEventPublisher } from '@OneJs/event-bus/application/publishers/in-memory-event-publisher'

export function createTestLogger(): Logger {
  return new Logger({ debugMode: true }, false)
}

export function createTestEventBus(): { eventBus: EventBus; logger: Logger } {
  const logger = createTestLogger()
  const configService = new ConfigService(logger)
  const eventPublisher = new InMemoryEventPublisher()
  const eventBus = new EventBus(eventPublisher, configService, logger)

  return { eventBus, logger }
}
