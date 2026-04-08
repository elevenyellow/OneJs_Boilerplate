import { DomainEvent } from '@OneJs/event-bus'
import type { TaskDto } from '@task/application/dtos/task.dto'
import type { Task } from '@task/domain/entities/task'

/**
 * Integration event emitted when a task is marked as completed.
 * Consumed by other apps (e.g. notifications).
 */
export class TaskCompletedIntegrationEvent extends DomainEvent {
  readonly payload: TaskDto

  constructor(task: Task) {
    super()
    this.payload = task.toDto()
  }
}
