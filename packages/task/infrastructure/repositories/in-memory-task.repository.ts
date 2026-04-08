import { Injectable } from '@OneJs/core'
import type { Task } from '../../domain/entities/task'
import type { ITaskRepository } from '../../domain/repositories/task.repository.interface'

@Injectable()
export class InMemoryTaskRepository implements ITaskRepository {
  private readonly store = new Map<string, Task>()

  async findAll(): Promise<Task[]> {
    return Array.from(this.store.values())
  }

  async findById(id: string): Promise<Task | null> {
    return this.store.get(id) ?? null
  }

  async save(task: Task): Promise<void> {
    this.store.set(task.getId().getValue(), task)
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id)
  }
}
