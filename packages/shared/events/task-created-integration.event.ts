import { DomainEvent } from '@OneJs/event-bus'
import type { TaskDto } from '@task/application/dtos/task.dto'
import type { Task } from '@task/domain/entities/task'

/**
 * Integration event intended to be consumed by other apps/modules.
 */
export class TaskCreatedIntegrationEvent extends DomainEvent {
  readonly payload: TaskDto

  constructor(task: Task) {
    super()
    this.payload = task.toDto()
  }
}
