import { DomainEvent } from '@EyJs'
import type { Job } from 'bullmq'

export class RegisterWorkerEvent extends DomainEvent {
  constructor(
    public readonly queueName: string,
    public readonly processor: (job: Job) => Promise<any>,
    public readonly concurrency: number,
    public readonly occurredOn: Date = new Date(),
  ) {
    super(occurredOn)
  }
}
