import { Injectable } from '@OneJs/core'
import type { Task } from '../../domain/entities/task'
import type { ITaskRepository } from '../../domain/repositories/task.repository.interface'
import type { TaskId } from '../../domain/value-objects/task-id'

@Injectable()
export class InMemoryTaskRepository implements ITaskRepository {
  private readonly store = new Map<string, Task>()

  async findAll(): Promise<Task[]> {
    return Array.from(this.store.values())
  }

  async findById(id: TaskId): Promise<Task | null> {
    return this.store.get(id.getValue()) ?? null
  }

  async save(task: Task): Promise<void> {
    this.store.set(task.getId().getValue(), task)
  }

  async delete(id: TaskId): Promise<void> {
    this.store.delete(id.getValue())
  }
}
