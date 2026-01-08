import { DomainEvent } from '@OneJs/event-bus'
import type { ZoneEntity } from '../entities/zone.entity'

export class ZoneUpdatedEvent extends DomainEvent {
  constructor(
    public readonly zone: ZoneEntity,
    public readonly occurredOn: Date = new Date(),
  ) {
    super(occurredOn)
  }
}

export class ZoneCreatedEvent extends DomainEvent {
  constructor(
    public readonly zone: ZoneEntity,
    public readonly occurredOn: Date = new Date(),
  ) {
    super(occurredOn)
  }
}


