import { DomainEvent } from '@onejs/event-bus'
import { PostEntity } from '../entities/post'

export class PostCreatedEvent extends DomainEvent {
  constructor(
    public readonly post: PostEntity,
    public readonly occurredOn: Date = new Date(),
  ) {
    super(occurredOn)
  }
}
