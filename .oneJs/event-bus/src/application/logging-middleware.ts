import { logger } from '@OneJs/core'
import type { DomainEvent } from '../domain/events/domain-events'
import type { EventBusMiddlewareInterface as Middleware } from './middleware'

export const LoggingMiddleware: Middleware = async (
  event: DomainEvent,
  next: () => Promise<void>,
) => {
  logger.debug('oneJs:event-bus', `Receive event: ${event.constructor.name} at ${event.occurredOn}`)
  await next()
  logger.debug('oneJs:event-bus', `Process event: ${event.constructor.name}`)
}
