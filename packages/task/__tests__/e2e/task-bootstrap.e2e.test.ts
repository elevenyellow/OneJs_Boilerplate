/**
 * E2E tests for bootstrap seeding.
 *
 * Verifies that after OneJs boots with TaskSeeder via @Module,
 * the seeded tasks are accessible through the full HTTP pipeline.
 */

import { ErrorCodes, OneJsError } from '@OneJs/core'
import { createSuccessResponse } from '@OneJs/server/types/response'
import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Elysia } from 'elysia'
import { TaskSeeder } from '../../application/bootstrap/task-seeder'
import { TaskService } from '../../application/task.service'
import { TaskController } from '../../infrastructure/controllers/task.controller'
import { InMemoryTaskRepository } from '../../infrastructure/repositories/in-memory-task.repository'

const BASE = 'http://test'

function createSeededApp() {
  const repo = new InMemoryTaskRepository()
  const eventBus = { publish: mock(async () => {}) }
  const logger = {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  }
  const service = new TaskService(repo as any, eventBus as any, logger as any)
  const controller = new TaskController(service as any)
  const seeder = new TaskSeeder(repo, logger as any)

  const app = new Elysia({ prefix: '/api' })
    .onError(({ error, set }) => {
      const err = error as any
      if (typeof err.statusCode === 'number') {
        set.status = err.statusCode
        return {
          success: false,
          message: err.message,
          data: err.data ?? {},
          timestamp: new Date().toISOString(),
          error: { statusCode: err.statusCode, code: err.code },
        }
      }
      set.status = 500
      return {
        success: false,
        message: 'Internal Server Error',
        data: {},
        timestamp: new Date().toISOString(),
        error: { statusCode: 500 },
      }
    })
    .get('/tasks', async (ctx) => {
      const result = await controller.getAll(ctx as any)
      return createSuccessResponse(result)
    })
    .get('/tasks/:id', async (ctx) => {
      const result = await controller.getById(ctx as any)
      return createSuccessResponse(result)
    })

  return { app, repo, seeder }
}

function get(path: string) {
  return new Request(`${BASE}${path}`)
}

describe('Task Bootstrap — E2E (seeded data via HTTP)', () => {
  let app: Elysia
  let repo: InMemoryTaskRepository
  let seeder: TaskSeeder

  beforeEach(async () => {
    const ctx = createSeededApp()
    app = ctx.app
    repo = ctx.repo
    seeder = ctx.seeder

    await seeder.bootstrap()
  })

  it('GET /api/tasks returns the 3 seeded tasks', async () => {
    const res = await app.handle(get('/api/tasks'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(3)
  })

  it('seeded tasks have expected titles', async () => {
    const res = await app.handle(get('/api/tasks'))
    const body = await res.json()
    const titles = body.data.map((t: any) => t.title)

    expect(titles).toContain('Setup project')
    expect(titles).toContain('Configure database')
    expect(titles).toContain('Write tests')
  })

  it('seeded tasks are all pending (done=false)', async () => {
    const res = await app.handle(get('/api/tasks'))
    const body = await res.json()

    for (const task of body.data) {
      expect(task.done).toBe(false)
    }
  })

  it('each seeded task is retrievable by id', async () => {
    const listRes = await app.handle(get('/api/tasks'))
    const tasks = (await listRes.json()).data

    for (const task of tasks) {
      const res = await app.handle(get(`/api/tasks/${task.id}`))
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.data.id).toBe(task.id)
      expect(body.data.title).toBe(task.title)
    }
  })

  it('seeded tasks have valid timestamps', async () => {
    const res = await app.handle(get('/api/tasks'))
    const body = await res.json()

    for (const task of body.data) {
      const date = new Date(task.createdAt)
      expect(date.getTime()).not.toBeNaN()
    }
  })

  it('running seeder again does not duplicate tasks', async () => {
    await seeder.bootstrap()

    const res = await app.handle(get('/api/tasks'))
    const body = await res.json()

    expect(body.data).toHaveLength(3)
  })
})
