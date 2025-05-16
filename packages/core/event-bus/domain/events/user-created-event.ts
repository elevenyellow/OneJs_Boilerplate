// src/application/events/UserCreatedEvent.ts
import type { DomainEvent } from '../../domain/events/domain-events'

export class UserCreatedEvent implements DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly occurredOn: Date = new Date(),
  ) {}
}
