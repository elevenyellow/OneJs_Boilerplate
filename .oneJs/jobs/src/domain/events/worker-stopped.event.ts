import { DomainEvent } from '@OneJs/event-bus'
import { Worker } from 'bullmq'

export class WorkerStoppedEvent extends DomainEvent {
  constructor(
    public readonly queueName: string,
    public readonly worker: Worker,
    public readonly occurredOn: Date = new Date(),
  ) {
    super(occurredOn)
  }
}
