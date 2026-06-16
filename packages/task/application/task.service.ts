import { ErrorCodes, Inject, Injectable, Logger, OneJsError } from '@OneJs/core'
import { EventBus } from '@OneJs/event-bus'
import {
  TaskCompletedIntegrationEvent,
  TaskCreatedIntegrationEvent,
} from '@shared/events'
import { Task } from '../domain/entities/task'
import { TaskCreatedEvent } from '../domain/events/task-created.event'
import type { ITaskRepository } from '../domain/repositories/task.repository.interface'
import { InMemoryTaskRepository } from '../infrastructure/repositories/in-memory-task.repository'

@Injectable()
export class TaskService {
  constructor(
    @Inject(InMemoryTaskRepository)
    private readonly repository: ITaskRepository,
    @Inject(EventBus) private readonly eventBus: EventBus,
    @Inject(Logger) private readonly logger: Logger,
  ) {}

  async getAll(): Promise<Task[]> {
    return this.repository.findAll()
  }

  async getById(id: string): Promise<Task | null> {
    return this.repository.findById(id)
  }

  async create(title: string, description: string): Promise<Task> {
    const task = Task.create(title, description)

    await this.repository.save(task)
    await this.eventBus.publish(new TaskCreatedEvent(task))
    await this.eventBus.publish(new TaskCreatedIntegrationEvent(task))

    this.logger.debug(
      'task:service',
      `Task created: ${task.getId().getValue()}`,
    )
    return task
  }

  async complete(id: string): Promise<Task> {
    const task = await this.repository.findById(id)
    if (!task)
      throw new OneJsError(
        'Not Found',
        404,
        `Task not found: ${id}`,
        {},
        ErrorCodes.RESOURCE_NOT_FOUND,
      )

    const completed = task.complete()
    await this.repository.save(completed)
    await this.eventBus.publish(new TaskCompletedIntegrationEvent(completed))
    return completed
  }

  async delete(id: string): Promise<void> {
    const task = await this.repository.findById(id)
    if (!task)
      throw new OneJsError(
        'Not Found',
        404,
        `Task not found: ${id}`,
        {},
        ErrorCodes.RESOURCE_NOT_FOUND,
      )

    await this.repository.delete(id)
    this.logger.debug('task:service', `Task deleted: ${id}`)
  }
}
