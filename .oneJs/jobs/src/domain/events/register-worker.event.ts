import { DomainEvent } from '@OneJs/event-bus'
import type { Job } from 'bullmq'

export class RegisterWorkerEvent extends DomainEvent {
  constructor(
    public readonly queueName: string,
    public readonly processor: (job: Job) => Promise<unknown>,
    public readonly concurrency: number,
    public readonly occurredOn: Date = new Date(),
  ) {
    super(occurredOn)
  }
}
