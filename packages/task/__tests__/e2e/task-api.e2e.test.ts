/**
 * E2E tests: Elysia HTTP pipeline → Auth → Controller → Service → InMemoryRepository
 *
 * Uses Elysia's `handle()` to process real HTTP Requests through the full
 * routing, auth-guard, error-handling, and response-formatting pipeline —
 * no running server required.
 *
 * Auth matrix (mirrors the real @UseAuth / @Roles decorators):
 *   GET    /tasks              → public
 *   GET    /tasks/:id          → any authenticated user
 *   POST   /tasks              → any authenticated user
 *   PATCH  /tasks/:id/complete → staff | admin
 *   DELETE /tasks/:id          → admin only
 */

import { ErrorCodes, OneJsError } from '@OneJs/core'
import { createSuccessResponse } from '@OneJs/server/types/response'
import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Elysia } from 'elysia'
import { TaskService } from '../../application/task.service'
import { TaskController } from '../../infrastructure/controllers/task.controller'
import { InMemoryTaskRepository } from '../../infrastructure/repositories/in-memory-task.repository'

const BASE = 'http://test'

// ── Test tokens ─────────────────────────────────────────────
const TOKENS = {
  user: 'token-user',
  staff: 'token-staff',
  admin: 'token-admin',
} as const

const TEST_USERS: Record<
  string,
  { userId: string; email: string; role: string; payload: any }
> = {
  [TOKENS.user]: {
    userId: 'u1',
    email: 'user@test.com',
    role: 'user',
    payload: {},
  },
  [TOKENS.staff]: {
    userId: 'u2',
    email: 'staff@test.com',
    role: 'staff',
    payload: {},
  },
  [TOKENS.admin]: {
    userId: 'u3',
    email: 'admin@test.com',
    role: 'admin',
    payload: {},
  },
}

function authGuard(requiredRoles?: string[]) {
  return async (ctx: any) => {
    const header = ctx.request.headers.get('authorization')
    if (!header?.startsWith('Bearer ')) {
      throw new OneJsError(
        'Unauthorized',
        401,
        'Bearer token is required',
        { header },
        ErrorCodes.AUTH_MISSING,
      )
    }

    const token = header.replace('Bearer ', '')
    const user = TEST_USERS[token]
    if (!user) {
      throw new OneJsError(
        'Unauthorized',
        401,
        'Token is invalid or expired',
        { token },
        ErrorCodes.AUTH_INVALID,
      )
    }

    if (requiredRoles?.length && !requiredRoles.includes(user.role)) {
      throw new OneJsError(
        'Forbidden',
        403,
        'You do not have the required role to access this resource',
        { requiredRoles, userRole: user.role },
        ErrorCodes.PERMISSION_DENIED,
      )
    }

    ctx.store = ctx.store || {}
    ctx.store.user = user
  }
}

// ── Elysia app factory ──────────────────────────────────────
function createE2EApp() {
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
          error: {
            statusCode: err.statusCode,
            message: err.explanatoryMessage,
            code: err.code,
          },
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
    // Public
    .get('/tasks', async (ctx) => {
      const result = await controller.getAll(ctx as any)
      return createSuccessResponse(result)
    })
    // Authenticated
    .get(
      '/tasks/:id',
      async (ctx) => {
        const result = await controller.getById(ctx as any)
        return createSuccessResponse(result)
      },
      { beforeHandle: authGuard() },
    )
    .post(
      '/tasks',
      async (ctx) => {
        const result = await controller.create(ctx as any)
        return createSuccessResponse(result)
      },
      { beforeHandle: authGuard() },
    )
    // Staff + Admin
    .patch(
      '/tasks/:id/complete',
      async (ctx) => {
        const result = await controller.complete(ctx as any)
        return createSuccessResponse(result)
      },
      { beforeHandle: authGuard(['staff', 'admin']) },
    )
    // Admin only
    .delete(
      '/tasks/:id',
      async (ctx) => {
        await controller.delete(ctx as any)
      },
      { beforeHandle: authGuard(['admin']) },
    )

  return app
}

// ── Request helpers ─────────────────────────────────────────
function get(path: string, token?: string) {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return new Request(`${BASE}${path}`, { headers })
}

function post(path: string, body: object, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return new Request(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

function patch(path: string, token?: string) {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return new Request(`${BASE}${path}`, { method: 'PATCH', headers })
}

function del(path: string, token?: string) {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return new Request(`${BASE}${path}`, { method: 'DELETE', headers })
}

// helper: create a task and return its DTO
async function createTask(app: any, title: string, token = TOKENS.admin) {
  const res = await app.handle(
    post('/api/tasks', { title, description: '' }, token),
  )
  return (await res.json()).data
}

// ═════════════════════════════════════════════════════════════
// Tests
// ═════════════════════════════════════════════════════════════

describe('Task API — E2E (Elysia handle)', () => {
  let app: ReturnType<typeof createE2EApp>

  beforeEach(() => {
    app = createE2EApp()
  })

  // ── GET /api/tasks (public) ─────────────────────────────────

  describe('GET /api/tasks (public)', () => {
    it('returns 200 with empty array initially', async () => {
      const res = await app.handle(get('/api/tasks'))

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data).toEqual([])
    })

    it('returns all created tasks without auth', async () => {
      await createTask(app, 'Task A')
      await createTask(app, 'Task B')

      const res = await app.handle(get('/api/tasks'))
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.data).toHaveLength(2)
    })
  })

  // ── POST /api/tasks (authenticated) ─────────────────────────

  describe('POST /api/tasks (authenticated)', () => {
    it('returns 401 without token', async () => {
      const res = await app.handle(post('/api/tasks', { title: 'No auth' }))

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error.code).toBe('AUTH_MISSING')
    })

    it('returns 401 with invalid token', async () => {
      const res = await app.handle(
        post('/api/tasks', { title: 'Bad token' }, 'garbage'),
      )

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error.code).toBe('AUTH_INVALID')
    })

    it('user role can create tasks', async () => {
      const res = await app.handle(
        post(
          '/api/tasks',
          { title: 'User task', description: 'by user' },
          TOKENS.user,
        ),
      )

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.title).toBe('User task')
    })

    it('staff role can create tasks', async () => {
      const res = await app.handle(
        post('/api/tasks', { title: 'Staff task' }, TOKENS.staff),
      )
      expect(res.status).toBe(201)
    })

    it('admin role can create tasks', async () => {
      const res = await app.handle(
        post('/api/tasks', { title: 'Admin task' }, TOKENS.admin),
      )
      expect(res.status).toBe(201)
    })

    it('returns 400 when title is missing (even with valid token)', async () => {
      const res = await app.handle(post('/api/tasks', {}, TOKENS.user))

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.success).toBe(false)
    })
  })

  // ── GET /api/tasks/:id (authenticated) ──────────────────────

  describe('GET /api/tasks/:id (authenticated)', () => {
    it('returns 401 without token', async () => {
      const task = await createTask(app, 'Protected')
      const res = await app.handle(get(`/api/tasks/${task.id}`))

      expect(res.status).toBe(401)
    })

    it('any authenticated user can read a task', async () => {
      const task = await createTask(app, 'Readable')

      const res = await app.handle(get(`/api/tasks/${task.id}`, TOKENS.user))
      expect(res.status).toBe(200)
      expect((await res.json()).data.title).toBe('Readable')
    })

    it('returns 404 for non-existent task', async () => {
      const res = await app.handle(
        get('/api/tasks/550e8400-e29b-41d4-a716-446655440099', TOKENS.user),
      )
      expect(res.status).toBe(404)
    })
  })

  // ── PATCH /api/tasks/:id/complete (staff + admin) ───────────

  describe('PATCH /api/tasks/:id/complete (staff + admin)', () => {
    it('returns 401 without token', async () => {
      const task = await createTask(app, 'Complete target')
      const res = await app.handle(patch(`/api/tasks/${task.id}/complete`))

      expect(res.status).toBe(401)
    })

    it('returns 403 for user role', async () => {
      const task = await createTask(app, 'User cannot complete')
      const res = await app.handle(
        patch(`/api/tasks/${task.id}/complete`, TOKENS.user),
      )

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error.code).toBe('PERMISSION_DENIED')
    })

    it('staff can complete a task', async () => {
      const task = await createTask(app, 'Staff completes')
      const res = await app.handle(
        patch(`/api/tasks/${task.id}/complete`, TOKENS.staff),
      )

      expect(res.status).toBe(200)
      expect((await res.json()).data.done).toBe(true)
    })

    it('admin can complete a task', async () => {
      const task = await createTask(app, 'Admin completes')
      const res = await app.handle(
        patch(`/api/tasks/${task.id}/complete`, TOKENS.admin),
      )

      expect(res.status).toBe(200)
      expect((await res.json()).data.done).toBe(true)
    })

    it('returns 404 when task does not exist (even with valid role)', async () => {
      const res = await app.handle(
        patch(
          '/api/tasks/550e8400-e29b-41d4-a716-446655440099/complete',
          TOKENS.admin,
        ),
      )
      expect(res.status).toBe(404)
    })
  })

  // ── DELETE /api/tasks/:id (admin only) ──────────────────────

  describe('DELETE /api/tasks/:id (admin only)', () => {
    it('returns 401 without token', async () => {
      const task = await createTask(app, 'Delete target')
      const res = await app.handle(del(`/api/tasks/${task.id}`))

      expect(res.status).toBe(401)
    })

    it('returns 403 for user role', async () => {
      const task = await createTask(app, 'User cannot delete')
      const res = await app.handle(del(`/api/tasks/${task.id}`, TOKENS.user))

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error.code).toBe('PERMISSION_DENIED')
    })

    it('returns 403 for staff role', async () => {
      const task = await createTask(app, 'Staff cannot delete')
      const res = await app.handle(del(`/api/tasks/${task.id}`, TOKENS.staff))

      expect(res.status).toBe(403)
    })

    it('admin can delete a task', async () => {
      const task = await createTask(app, 'Admin deletes')
      const res = await app.handle(del(`/api/tasks/${task.id}`, TOKENS.admin))

      expect(res.status).toBe(204)
    })

    it('returns 404 when task does not exist (even as admin)', async () => {
      const res = await app.handle(
        del('/api/tasks/550e8400-e29b-41d4-a716-446655440099', TOKENS.admin),
      )
      expect(res.status).toBe(404)
    })
  })

  // ── Full CRUD lifecycle with roles ──────────────────────────

  describe('full lifecycle with roles', () => {
    it('user creates → staff completes → admin deletes', async () => {
      // User creates
      const createRes = await app.handle(
        post(
          '/api/tasks',
          { title: 'Role lifecycle', description: 'multi-role' },
          TOKENS.user,
        ),
      )
      expect(createRes.status).toBe(201)
      const task = (await createRes.json()).data

      // User can read
      const readRes = await app.handle(
        get(`/api/tasks/${task.id}`, TOKENS.user),
      )
      expect(readRes.status).toBe(200)

      // User cannot complete
      const userCompleteRes = await app.handle(
        patch(`/api/tasks/${task.id}/complete`, TOKENS.user),
      )
      expect(userCompleteRes.status).toBe(403)

      // Staff completes
      const staffCompleteRes = await app.handle(
        patch(`/api/tasks/${task.id}/complete`, TOKENS.staff),
      )
      expect(staffCompleteRes.status).toBe(200)
      expect((await staffCompleteRes.json()).data.done).toBe(true)

      // Staff cannot delete
      const staffDeleteRes = await app.handle(
        del(`/api/tasks/${task.id}`, TOKENS.staff),
      )
      expect(staffDeleteRes.status).toBe(403)

      // Admin deletes
      const adminDeleteRes = await app.handle(
        del(`/api/tasks/${task.id}`, TOKENS.admin),
      )
      expect(adminDeleteRes.status).toBe(204)

      // Confirm gone
      const goneRes = await app.handle(
        get(`/api/tasks/${task.id}`, TOKENS.admin),
      )
      expect(goneRes.status).toBe(404)
    })
  })

  // ── Response format ─────────────────────────────────────────

  describe('response format', () => {
    it('success responses include success, message, data, and timestamp', async () => {
      const res = await app.handle(get('/api/tasks'))
      const body = await res.json()

      expect(body).toHaveProperty('success', true)
      expect(body).toHaveProperty('message', 'Success')
      expect(body).toHaveProperty('data')
      expect(typeof body.timestamp).toBe('string')
    })

    it('error responses include success=false, error.statusCode, and error.code', async () => {
      const res = await app.handle(
        get('/api/tasks/550e8400-e29b-41d4-a716-446655440099'),
      )
      const body = await res.json()

      expect(body.success).toBe(false)
      expect(body.error.statusCode).toBe(401)
      expect(body.error.code).toBe('AUTH_MISSING')
    })

    it('403 response includes the required roles in data', async () => {
      const task = await createTask(app, 'Forbidden check')
      const res = await app.handle(del(`/api/tasks/${task.id}`, TOKENS.user))
      const body = await res.json()

      expect(body.error.statusCode).toBe(403)
      expect(body.data.requiredRoles).toContain('admin')
      expect(body.data.userRole).toBe('user')
    })
  })
})
