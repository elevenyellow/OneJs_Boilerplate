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
    private readonly _title: TaskTitle,
    private readonly _description: TaskDescription,
    private readonly _status: TaskStatus,
    private readonly _createdAt: Date,
  ) {
    super(id)
  }

  getTitle(): TaskTitle {
    return this._title
  }

  getDescription(): TaskDescription {
    return this._description
  }

  getStatus(): TaskStatus {
    return this._status
  }

  getCreatedAt(): Date {
    return this._createdAt
  }

  static create(title: TaskTitle, description: TaskDescription): Task {
    return new Task(
      TaskId.generateUniqueId(),
      title,
      description,
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
      this._title,
      this._description,
      TaskStatus.done(),
      this._createdAt,
    )
  }

  toDto(): TaskDto {
    return new TaskDto(
      this.getId().getValue(),
      this._title.getValue(),
      this._description.getValue(),
      this._status.getValue(),
      this._createdAt,
    )
  }
}
