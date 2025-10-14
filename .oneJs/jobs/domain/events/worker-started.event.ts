import { DomainEvent } from '@OneJs'
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
