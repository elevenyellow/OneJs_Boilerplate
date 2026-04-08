import { Inject, Injectable, Logger } from '@OneJs/core'
import { EventHandler } from '@OneJs/event-bus'
import { TaskCreatedEvent } from '../../domain/events/task-created.event'

@Injectable()
export class TaskCreatedHandler {
  constructor(@Inject(Logger) private readonly logger: Logger) {}

  @EventHandler(TaskCreatedEvent)
  async handle(event: TaskCreatedEvent): Promise<void> {
    const { id, title } = event.payload
    this.logger.info(
      'task:events',
      `New task created — id: ${id}, title: "${title}"`,
    )
  }
}
