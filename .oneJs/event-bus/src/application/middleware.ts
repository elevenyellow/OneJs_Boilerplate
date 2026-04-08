import type { DomainEvent } from '../domain/events/domain-events'

export type EventBusMiddlewareInterface = (
  event: DomainEvent,
  next: () => Promise<void>,
) => Promise<void>
