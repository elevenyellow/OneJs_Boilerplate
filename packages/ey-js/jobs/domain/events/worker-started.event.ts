import { DomainEvent } from '@EyJs/EventBus'
import { Worker } from 'bullmq'

export class WorkerStartedEvent extends DomainEvent {
  constructor(
    public readonly queueName: string,
    public readonly worker: Worker,
    public readonly occurredOn: Date = new Date(),
  ) {
    super(occurredOn)
  }
}
