import { DomainEvent } from '@OneJs/event-bus'
import type { ClimbingZoneEntity } from '../entities/climbing-zone.entity'

export class ZoneSyncedEvent extends DomainEvent {
  constructor(
    public readonly zone: ClimbingZoneEntity,
    public readonly action: 'created' | 'updated',
    public readonly occurredOn: Date = new Date(),
  ) {
    super(occurredOn)
  }
}
