import { DomainEvent } from '@OneJs/event-bus'
import type { TaskDto } from '../../application/dtos/task.dto'
import type { Task } from '../entities/task'

export class TaskCreatedEvent extends DomainEvent {
  readonly payload: TaskDto

  constructor(task: Task) {
    super()
    this.payload = task.toDto()
  }
}
