import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { OneJsError } from '@OneJs/core'
import { TaskController } from '../../infrastructure/controllers/task.controller'
import { TaskService } from '../../application/task.service'
import { InMemoryTaskRepository } from '../../infrastructure/repositories/in-memory-task.repository'

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

function makeCtx(overrides: Record<string, any> = {}) {
  return {
    params: {},
    body: {},
    set: { status: 200 },
    ...overrides,
  } as any
}

describe('Task API — integration (no mocks)', () => {
  let controller: TaskController

  beforeEach(() => {
    const repo = new InMemoryTaskRepository()
    const eventBus = makeEventBus()
    const logger = makeLogger()
    const service = new TaskService(repo as any, eventBus as any, logger as any)
    controller = new TaskController(service)
  })

  it('starts with an empty task list', async () => {
    const result = await controller.getAll(makeCtx())
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(0)
  })

  it('creates a task and returns 201', async () => {
    const ctx = makeCtx({ body: { title: 'Integration task', description: 'Created in test' } })
    const result = await controller.create(ctx)

    expect(ctx.set.status).toBe(201)
    expect((result as any).title).toBe('Integration task')
    expect((result as any).description).toBe('Created in test')
    expect((result as any).done).toBe(false)
    expect(typeof (result as any).id).toBe('string')
  })

  it('retrieves the created task by id', async () => {
    const createCtx = makeCtx({ body: { title: 'Find me', description: '' } })
    const created = await controller.create(createCtx) as any

    const found = await controller.getById(makeCtx({ params: { id: created.id } }))
    expect((found as any).id).toBe(created.id)
    expect((found as any).title).toBe('Find me')
  })

  it('throws 404 when task does not exist', async () => {
    try {
      await controller.getById(makeCtx({ params: { id: '550e8400-e29b-41d4-a716-446655440099' } }))
      expect.unreachable('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(OneJsError)
      expect((err as OneJsError).statusCode).toBe(404)
    }
  })

  it('completes a task', async () => {
    const createCtx = makeCtx({ body: { title: 'Complete me', description: '' } })
    const created = await controller.create(createCtx) as any

    const completed = await controller.complete(makeCtx({ params: { id: created.id } }))
    expect((completed as any).done).toBe(true)
    expect((completed as any).id).toBe(created.id)
  })

  it('throws 404 when completing non-existent task', async () => {
    try {
      await controller.complete(makeCtx({ params: { id: '550e8400-e29b-41d4-a716-446655440099' } }))
      expect.unreachable('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(OneJsError)
      expect((err as OneJsError).statusCode).toBe(404)
    }
  })

  it('deletes a task', async () => {
    const createCtx = makeCtx({ body: { title: 'Delete me', description: '' } })
    const created = await controller.create(createCtx) as any

    const deleteCtx = makeCtx({ params: { id: created.id } })
    await controller.delete(deleteCtx)
    expect(deleteCtx.set.status).toBe(204)

    try {
      await controller.getById(makeCtx({ params: { id: created.id } }))
      expect.unreachable('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(OneJsError)
      expect((err as OneJsError).statusCode).toBe(404)
    }
  })

  it('throws 404 when deleting non-existent task', async () => {
    try {
      await controller.delete(makeCtx({ params: { id: '550e8400-e29b-41d4-a716-446655440099' } }))
      expect.unreachable('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(OneJsError)
      expect((err as OneJsError).statusCode).toBe(404)
    }
  })

  it('lists all created tasks', async () => {
    await controller.create(makeCtx({ body: { title: 'Task A', description: '' } }))
    await controller.create(makeCtx({ body: { title: 'Task B', description: '' } }))
    await controller.create(makeCtx({ body: { title: 'Task C', description: '' } }))

    const result = await controller.getAll(makeCtx())
    expect(Array.isArray(result)).toBe(true)
    expect((result as any[]).length).toBe(3)
  })

  it('throws 400 when title is missing on create', async () => {
    try {
      await controller.create(makeCtx({ body: {} }))
      expect.unreachable('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(OneJsError)
      expect((err as OneJsError).statusCode).toBe(400)
    }
  })
})
