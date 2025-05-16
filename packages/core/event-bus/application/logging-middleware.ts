import type { DomainEvent } from '../domain/events/domain-events'
import type { Middleware } from './middleware'

export const LoggingMiddleware: Middleware = async (
  event: DomainEvent,
  next: () => Promise<void>,
) => {
  console.log(`Receive event: ${event.constructor.name} en ${event.occurredOn}`)
  await next()
  console.log(`Process event: ${event.constructor.name}`)
}
