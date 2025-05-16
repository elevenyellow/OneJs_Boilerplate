import type { DomainEvent } from '../domain/events/domain-events'

export type Middleware = (
  event: DomainEvent,
  next: () => Promise<void>,
) => Promise<void>
