import { Entity, EntityBase } from '@OneJs/core'
import { TaskDto } from '../../application/dtos/task.dto'
import { TaskDescription } from '../value-objects/task-description'
import { TaskId } from '../value-objects/task-id'
import { TaskStatus } from '../value-objects/task-status'
import { TaskTitle } from '../value-objects/task-title'

@Entity()
export class Task extends EntityBase<TaskId> {
  constructor(
    id: TaskId,
    readonly title: TaskTitle,
    readonly description: TaskDescription,
    readonly status: TaskStatus,
    readonly createdAt: Date,
  ) {
    super(id)
  }

  static create(title: string, description: string): Task {
    return new Task(
      TaskId.generateUniqueId(),
      TaskTitle.create(title),
      TaskDescription.create(description),
      TaskStatus.pending(),
      new Date(),
    )
  }

  static reconstitute(
    id: string,
    title: string,
    description: string,
    done: boolean,
    createdAt: Date,
  ): Task {
    return new Task(
      TaskId.fromString(id),
      TaskTitle.create(title),
      TaskDescription.create(description),
      TaskStatus.from(done),
      createdAt,
    )
  }

  complete(): Task {
    return new Task(
      this.getId(),
      this.title,
      this.description,
      TaskStatus.done(),
      this.createdAt,
    )
  }

  toDto(): TaskDto {
    return new TaskDto(
      this.getId().getValue(),
      this.title.getValue(),
      this.description.getValue(),
      this.status.getValue(),
      this.createdAt,
    )
  }
}
