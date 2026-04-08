import { Inject, Injectable, Logger } from '@OneJs/core'
import type { TaskDto } from '@task/application/dtos/task.dto'

@Injectable()
export class NotificationService {
  constructor(@Inject(Logger) private readonly logger: Logger) {}

  notifyTaskCreated(task: TaskDto): void {
    this.logger.info(
      'notifications:service',
      `[EMAIL] Task created: "${task.title}" with description "${task.description}" — notifying team (id: ${task.id})`,
    )
  }

  notifyTaskCompleted(task: TaskDto): void {
    this.logger.info(
      'notifications:service',
      `[EMAIL] Task completed: "${task.title}" — sending summary report (id: ${task.id})`,
    )
  }
}
