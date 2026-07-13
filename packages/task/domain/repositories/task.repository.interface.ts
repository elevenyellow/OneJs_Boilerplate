import type { Task } from '../entities/task'
import type { TaskId } from '../value-objects/task-id'

export interface ITaskRepository {
  findAll(): Promise<Task[]>
  findById(id: TaskId): Promise<Task | null>
  save(task: Task): Promise<void>
  delete(id: TaskId): Promise<void>
}
