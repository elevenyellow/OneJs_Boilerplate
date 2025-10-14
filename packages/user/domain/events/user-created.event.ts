import { DomainEvent } from '@OneJs'
import { UserEntity } from '../entities/user.entity'

export class UserCreatedEvent extends DomainEvent {
  constructor(
    public readonly user: UserEntity,
    public readonly occurredOn: Date = new Date(),
  ) {
    super(occurredOn)
  }
}
