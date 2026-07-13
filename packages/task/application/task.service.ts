import { ErrorCodes, Inject, Injectable, Logger, OneJsError } from '@OneJs/core'
import { EventBus } from '@OneJs/event-bus'
import {
  TaskCompletedIntegrationEvent,
  TaskCreatedIntegrationEvent,
} from '@shared/events'
import { Task } from '../domain/entities/task'
import { TaskCreatedEvent } from '../domain/events/task-created.event'
import type { ITaskRepository } from '../domain/repositories/task.repository.interface'
import type { TaskDescription } from '../domain/value-objects/task-description'
import type { TaskId } from '../domain/value-objects/task-id'
import type { TaskTitle } from '../domain/value-objects/task-title'
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

  async getById(id: TaskId): Promise<Task | null> {
    return this.repository.findById(id)
  }

  async create(title: TaskTitle, description: TaskDescription): Promise<Task> {
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

  async complete(id: TaskId): Promise<Task> {
    const task = await this.repository.findById(id)
    if (!task)
      throw new OneJsError(
        'Not Found',
        404,
        `Task not found: ${id.getValue()}`,
        {},
        ErrorCodes.RESOURCE_NOT_FOUND,
      )

    const completed = task.complete()
    await this.repository.save(completed)
    await this.eventBus.publish(new TaskCompletedIntegrationEvent(completed))
    return completed
  }

  async delete(id: TaskId): Promise<void> {
    const task = await this.repository.findById(id)
    if (!task)
      throw new OneJsError(
        'Not Found',
        404,
        `Task not found: ${id.getValue()}`,
        {},
        ErrorCodes.RESOURCE_NOT_FOUND,
      )

    await this.repository.delete(id)
    this.logger.debug('task:service', `Task deleted: ${id.getValue()}`)
  }
}
