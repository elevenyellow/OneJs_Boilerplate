import { OneJsError } from '@OneJs/core'
import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Task } from '../../../domain/entities/task'
import { TaskController } from '../../../infrastructure/controllers/task.controller'

const UUID = '550e8400-e29b-41d4-a716-446655440000'
const task = (title = 'A', done = false) =>
  Task.reconstitute(UUID, title, '', done, new Date())

function makeService() {
  return {
    getAll: mock(async (): Promise<Task[]> => []),
    getById: mock(async (_id: string) => null as Task | null),
    create: mock(async (_title: string, _desc: string) => task(_title)),
    complete: mock(async (_id: string) => task('A', true)),
    delete: mock(async (_id: string) => {}),
  }
}

function makeCtx(overrides: Record<string, any> = {}) {
  return {
    params: {},
    body: {},
    set: { status: 200 },
    ...overrides,
  } as any
}

describe('TaskController', () => {
  let service: ReturnType<typeof makeService>
  let controller: TaskController

  beforeEach(() => {
    service = makeService()
    controller = new TaskController(service as any)
  })

  describe('getAll()', () => {
    it('returns serialized tasks as DTOs', async () => {
      const tasks = [task('Buy milk')]
      service.getAll = mock(async () => tasks)

      const result = await controller.getAll(makeCtx())
      expect(result).toEqual(tasks.map((t) => t.toDto()))
    })
  })

  describe('getById()', () => {
    it('returns the task DTO when found', async () => {
      const t = task('Buy milk')
      service.getById = mock(async () => t)

      const result = await controller.getById(makeCtx({ params: { id: UUID } }))
      expect(result).toEqual(t.toDto())
    })

    it('throws OneJsError 404 when not found', async () => {
      try {
        await controller.getById(makeCtx({ params: { id: UUID } }))
        expect.unreachable('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(OneJsError)
        expect((err as OneJsError).statusCode).toBe(404)
      }
    })
  })

  describe('create()', () => {
    it('returns 201 with the created task DTO', async () => {
      const ctx = makeCtx({
        body: { title: 'New task', description: 'Details' },
      })
      const result = await controller.create(ctx)

      expect(ctx.set.status).toBe(201)
      expect((result as any).title).toBe('New task')
    })

    it('throws OneJsError 400 when title is missing', async () => {
      try {
        await controller.create(makeCtx({ body: {} }))
        expect.unreachable('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(OneJsError)
        expect((err as OneJsError).statusCode).toBe(400)
      }
    })
  })

  describe('complete()', () => {
    it('returns the completed task DTO with done=true', async () => {
      const result = await controller.complete(
        makeCtx({ params: { id: UUID } }),
      )
      expect((result as any).done).toBe(true)
    })

    it('propagates error when service throws', async () => {
      const error = new OneJsError('Not Found', 404, 'Task not found', {})
      service.complete = mock(async () => {
        throw error
      })

      try {
        await controller.complete(makeCtx({ params: { id: UUID } }))
        expect.unreachable('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(OneJsError)
        expect((err as OneJsError).statusCode).toBe(404)
      }
    })
  })

  describe('delete()', () => {
    it('sets status 204 on success', async () => {
      const ctx = makeCtx({ params: { id: UUID } })
      await controller.delete(ctx)
      expect(ctx.set.status).toBe(204)
    })

    it('propagates error when service throws', async () => {
      const error = new OneJsError('Not Found', 404, 'Task not found', {})
      service.delete = mock(async () => {
        throw error
      })

      try {
        await controller.delete(makeCtx({ params: { id: UUID } }))
        expect.unreachable('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(OneJsError)
        expect((err as OneJsError).statusCode).toBe(404)
      }
    })
  })
})
