import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { OneJsError } from '@OneJs/core'
import { TaskCreatedIntegrationEvent } from '@shared/events'
import { Task } from '../../domain/entities/task'
import type { ITaskRepository } from '../../domain/repositories/task.repository.interface'
import { TaskService } from '../../application/task.service'

const UUID = '550e8400-e29b-41d4-a716-446655440000'
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const task = (title = 'A', done = false) =>
  Task.reconstitute(UUID, title, '', done, new Date())

function makeRepo(overrides: Partial<ITaskRepository> = {}): ITaskRepository {
  return {
    findAll: mock(async () => []),
    findById: mock(async () => null),
    save: mock(async () => {}),
    delete: mock(async () => {}),
    ...overrides,
  }
}

function makeEventBus() {
  return { publish: mock(async () => {}) }
}

function makeLogger() {
  return {
    debug: mock(() => {}),
    info: mock(() => {}),
    warn: mock(() => {}),
    error: mock(() => {}),
  }
}

describe('TaskService', () => {
  let repo: ITaskRepository
  let eventBus: ReturnType<typeof makeEventBus>
  let logger: ReturnType<typeof makeLogger>
  let service: TaskService

  beforeEach(() => {
    repo = makeRepo()
    eventBus = makeEventBus()
    logger = makeLogger()
    service = new TaskService(repo as any, eventBus as any, logger as any)
  })

  describe('getAll()', () => {
    it('delegates to repository', async () => {
      const tasks = [task()]
      repo.findAll = mock(async () => tasks)
      expect(await service.getAll()).toEqual(tasks)
    })
  })

  describe('getById()', () => {
    it('returns task when found', async () => {
      const t = task()
      repo.findById = mock(async () => t)
      expect(await service.getById(UUID)).toEqual(t)
    })

    it('returns null when not found', async () => {
      expect(await service.getById(UUID)).toBeNull()
    })
  })

  describe('create()', () => {
    it('saves the task with a generated UUID v4', async () => {
      const result = await service.create('Buy milk', 'Full fat')

      expect(result.title.getValue()).toBe('Buy milk')
      expect(result.description.getValue()).toBe('Full fat')
      expect(result.status.getValue()).toBe(false)
      expect(result.getId().getValue()).toMatch(UUID_REGEX)
      expect(repo.save).toHaveBeenCalledTimes(1)
    })

    it('publishes internal and cross-app events with a DTO payload', async () => {
      await service.create('Task', 'Details')

      expect(eventBus.publish).toHaveBeenCalledTimes(2)

      const internalEvent = eventBus.publish.mock.calls[0][0]
      const integrationEvent = eventBus.publish.mock.calls[1][0]

      expect(internalEvent.constructor.name).toBe('TaskCreatedEvent')
      expect(internalEvent.payload.title).toBe('Task')
      expect(internalEvent.payload.description).toBe('Details')

      expect(integrationEvent).toBeInstanceOf(TaskCreatedIntegrationEvent)
      expect(integrationEvent.payload.title).toBe('Task')
      expect(integrationEvent.payload.description).toBe('Details')
    })
  })

  describe('complete()', () => {
    it('marks the task as done', async () => {
      repo.findById = mock(async () => task())
      const result = await service.complete(UUID)
      expect(result.status.getValue()).toBe(true)
      expect(repo.save).toHaveBeenCalledTimes(1)
    })

    it('throws OneJsError when task not found', async () => {
      try {
        await service.complete(UUID)
        expect.unreachable('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(OneJsError)
        expect((err as OneJsError).statusCode).toBe(404)
        expect((err as OneJsError).explanatoryMessage).toBe(
          `Task not found: ${UUID}`,
        )
      }
    })
  })

  describe('delete()', () => {
    it('deletes the task', async () => {
      repo.findById = mock(async () => task())
      await service.delete(UUID)
      expect(repo.delete).toHaveBeenCalledWith(UUID)
    })

    it('throws OneJsError when task not found', async () => {
      try {
        await service.delete(UUID)
        expect.unreachable('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(OneJsError)
        expect((err as OneJsError).statusCode).toBe(404)
        expect((err as OneJsError).explanatoryMessage).toBe(
          `Task not found: ${UUID}`,
        )
      }
    })
  })
})
