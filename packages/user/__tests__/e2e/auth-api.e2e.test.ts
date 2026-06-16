/**
 * E2E tests: Elysia HTTP pipeline → Auth → Controller → Service → InMemoryRepository
 *
 * Uses Elysia's `handle()` to process real HTTP Requests through the full
 * routing, auth-guard, error-handling, and response-formatting pipeline —
 * no running server required.
 *
 * Auth matrix (mirrors the real @UseAuth decorator):
 *   POST   /auth/register          → public
 *   POST   /auth/login             → public
 *   POST   /auth/forgot-password   → public
 *   POST   /auth/reset-password    → public
 *   PATCH  /auth/password          → any authenticated user
 *   GET    /auth/me                → any authenticated user
 */

import { ErrorCodes, OneJsError } from '@OneJs/core'
import { createSuccessResponse } from '@OneJs/server/types/response'
import { beforeEach, describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'
import { UserService } from '../../application/user.service'
import { AuthController } from '../../infrastructure/controllers/auth.controller'
import { InMemoryUserRepository } from '../../infrastructure/repositories/in-memory-user.repository'

const BASE = 'http://test'

// ── Inline auth guard (mirrors AuthMiddleware) ───────────────
function authGuard() {
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
    // In real usage, LocalJwtStrategy.validate() decodes the JWT.
    // Here we accept any non-empty token and extract a stub user from it.
    const token = header.replace('Bearer ', '')
    if (!token) {
      throw new OneJsError(
        'Unauthorized',
        401,
        'Token is invalid',
        { token },
        ErrorCodes.AUTH_INVALID,
      )
    }
    ctx.store = ctx.store ?? {}
    ctx.store.__token = token
  }
}

// ── Elysia app factory ──────────────────────────────────────
function createE2EApp() {
  const repo = new InMemoryUserRepository()
  const eventBus = {
    publish: async () => {},
  }
  const configService = {
    get: (key: string) =>
      key === 'JWT_SECRET' ? 'e2e_test_secret' : undefined,
  }
  const logger = {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  }

  const service = new UserService(
    repo as any,
    eventBus as any,
    configService as any,
    logger as any,
  )
  const controller = new AuthController(service as any)

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
    // Public routes
    .post('/auth/register', async (ctx) => {
      const result = await controller.register(ctx as any)
      return createSuccessResponse(result)
    })
    .post('/auth/login', async (ctx) => {
      const result = await controller.login(ctx as any)
      return createSuccessResponse(result)
    })
    .post('/auth/forgot-password', async (ctx) => {
      const result = await controller.forgotPassword(ctx as any)
      return createSuccessResponse(result)
    })
    .post('/auth/reset-password', async (ctx) => {
      const result = await controller.resetPassword(ctx as any)
      return createSuccessResponse(result)
    })
    // Authenticated routes — beforeHandle injects store.__token; controller reads ctx.store.user
    // We do a second pass here to resolve the actual user after registration
    .patch(
      '/auth/password',
      async (ctx) => {
        const result = await controller.updatePassword(ctx as any)
        return createSuccessResponse(result)
      },
      {
        beforeHandle: async (ctx: any) => {
          await authGuard()(ctx)
          ctx.store.user = { userId: ctx.store.__token }
        },
      },
    )
    .get(
      '/auth/me',
      async (ctx) => {
        const result = await controller.me(ctx as any)
        return createSuccessResponse(result)
      },
      {
        beforeHandle: async (ctx: any) => {
          await authGuard()(ctx)
          ctx.store.user = { userId: ctx.store.__token }
        },
      },
    )

  return { app, service, repo }
}

// ── Request helpers ─────────────────────────────────────────
function post(path: string, body: object, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return new Request(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

function patch(path: string, body: object, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return new Request(`${BASE}${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  })
}

function get(path: string, token?: string) {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return new Request(`${BASE}${path}`, { method: 'GET', headers })
}

// ═══════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════

describe('Auth API — E2E (Elysia handle)', () => {
  let app: ReturnType<typeof createE2EApp>['app']
  let repo: ReturnType<typeof createE2EApp>['repo']

  beforeEach(() => {
    const result = createE2EApp()
    app = result.app
    repo = result.repo
  })

  // ── POST /api/auth/register ──────────────────────────────

  describe('POST /api/auth/register (public)', () => {
    it('returns 201 with the user DTO on valid input', async () => {
      const res = await app.handle(
        post('/api/auth/register', {
          email: 'new@example.com',
          password: 'password123',
        }),
      )

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data.email).toBe('new@example.com')
      expect(body.data.role).toBe('user')
      expect(body.data.passwordHash).toBeUndefined()
    })

    it('returns 409 when email is already registered', async () => {
      await app.handle(
        post('/api/auth/register', {
          email: 'dup@example.com',
          password: 'password123',
        }),
      )
      const res = await app.handle(
        post('/api/auth/register', {
          email: 'dup@example.com',
          password: 'password123',
        }),
      )

      expect(res.status).toBe(409)
    })

    it('returns 400 when email is missing', async () => {
      const res = await app.handle(
        post('/api/auth/register', { password: 'password123' }),
      )
      expect(res.status).toBe(400)
    })

    it('returns 400 when password is too short', async () => {
      const res = await app.handle(
        post('/api/auth/register', { email: 'a@b.com', password: 'short' }),
      )
      expect(res.status).toBe(400)
    })
  })

  // ── POST /api/auth/login ─────────────────────────────────

  describe('POST /api/auth/login (public)', () => {
    it('returns token and user DTO on valid credentials', async () => {
      await app.handle(
        post('/api/auth/register', {
          email: 'login@example.com',
          password: 'password123',
        }),
      )
      const res = await app.handle(
        post('/api/auth/login', {
          email: 'login@example.com',
          password: 'password123',
        }),
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(typeof body.data.token).toBe('string')
      expect(body.data.user.email).toBe('login@example.com')
    })

    it('returns 401 on wrong password', async () => {
      await app.handle(
        post('/api/auth/register', {
          email: 'fail@example.com',
          password: 'password123',
        }),
      )
      const res = await app.handle(
        post('/api/auth/login', {
          email: 'fail@example.com',
          password: 'wrongpassword',
        }),
      )

      expect(res.status).toBe(401)
    })

    it('returns 401 when user does not exist', async () => {
      const res = await app.handle(
        post('/api/auth/login', {
          email: 'ghost@example.com',
          password: 'password123',
        }),
      )
      expect(res.status).toBe(401)
    })
  })

  // ── POST /api/auth/forgot-password ───────────────────────

  describe('POST /api/auth/forgot-password (public)', () => {
    it('returns 200 with a resetToken when user exists', async () => {
      await app.handle(
        post('/api/auth/register', {
          email: 'reset@example.com',
          password: 'password123',
        }),
      )
      const res = await app.handle(
        post('/api/auth/forgot-password', { email: 'reset@example.com' }),
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.message).toBeDefined()
      expect(typeof body.data.resetToken).toBe('string')
    })

    it('returns 200 without resetToken when user does not exist (no enumeration)', async () => {
      const res = await app.handle(
        post('/api/auth/forgot-password', { email: 'nobody@example.com' }),
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.message).toBeDefined()
      expect(body.data.resetToken).toBeUndefined()
    })

    it('returns 400 when email is missing', async () => {
      const res = await app.handle(post('/api/auth/forgot-password', {}))
      expect(res.status).toBe(400)
    })
  })

  // ── POST /api/auth/reset-password ────────────────────────

  describe('POST /api/auth/reset-password (public)', () => {
    it('resets the password with a valid token', async () => {
      await app.handle(
        post('/api/auth/register', {
          email: 'r@example.com',
          password: 'password123',
        }),
      )
      const forgotRes = await app.handle(
        post('/api/auth/forgot-password', { email: 'r@example.com' }),
      )
      const { resetToken } = (await forgotRes.json()).data

      const res = await app.handle(
        post('/api/auth/reset-password', {
          token: resetToken,
          newPassword: 'brandnew123',
        }),
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.message).toBeDefined()
    })

    it('returns 400 on an invalid reset token', async () => {
      const res = await app.handle(
        post('/api/auth/reset-password', {
          token: '00000000-0000-4000-a000-000000000000',
          newPassword: 'newpassword123',
        }),
      )
      expect(res.status).toBe(400)
    })

    it('allows login with the new password after reset', async () => {
      await app.handle(
        post('/api/auth/register', {
          email: 'flow@example.com',
          password: 'oldpass123',
        }),
      )
      const forgotRes = await app.handle(
        post('/api/auth/forgot-password', { email: 'flow@example.com' }),
      )
      const { resetToken } = (await forgotRes.json()).data

      await app.handle(
        post('/api/auth/reset-password', {
          token: resetToken,
          newPassword: 'newpass456',
        }),
      )

      const loginRes = await app.handle(
        post('/api/auth/login', {
          email: 'flow@example.com',
          password: 'newpass456',
        }),
      )
      expect(loginRes.status).toBe(200)
    })
  })

  // ── PATCH /api/auth/password (authenticated) ─────────────

  describe('PATCH /api/auth/password (authenticated)', () => {
    it('returns 401 without token', async () => {
      const res = await app.handle(
        patch('/api/auth/password', {
          currentPassword: 'old',
          newPassword: 'new123456',
        }),
      )
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error.code).toBe('AUTH_MISSING')
    })

    it('updates the password and allows login with new password', async () => {
      // Register
      const regRes = await app.handle(
        post('/api/auth/register', {
          email: 'update@example.com',
          password: 'oldpass123',
        }),
      )
      const userId = (await regRes.json()).data.id

      // Update using userId as stub token
      const patchRes = await app.handle(
        patch(
          '/api/auth/password',
          { currentPassword: 'oldpass123', newPassword: 'newpass456' },
          userId,
        ),
      )
      expect(patchRes.status).toBe(200)

      // Confirm new password works
      const loginRes = await app.handle(
        post('/api/auth/login', {
          email: 'update@example.com',
          password: 'newpass456',
        }),
      )
      expect(loginRes.status).toBe(200)
    })

    it('returns 401 when current password is wrong', async () => {
      const regRes = await app.handle(
        post('/api/auth/register', {
          email: 'wrong@example.com',
          password: 'correct123',
        }),
      )
      const userId = (await regRes.json()).data.id

      const res = await app.handle(
        patch(
          '/api/auth/password',
          { currentPassword: 'wrongpass!', newPassword: 'newpass456' },
          userId,
        ),
      )
      expect(res.status).toBe(401)
    })
  })

  // ── GET /api/auth/me (authenticated) ────────────────────

  describe('GET /api/auth/me (authenticated)', () => {
    it('returns 401 without token', async () => {
      const res = await app.handle(get('/api/auth/me'))
      expect(res.status).toBe(401)
    })

    it('returns the user profile for an authenticated user', async () => {
      const regRes = await app.handle(
        post('/api/auth/register', {
          email: 'me@example.com',
          password: 'password123',
        }),
      )
      const userId = (await regRes.json()).data.id

      const res = await app.handle(get('/api/auth/me', userId))

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.email).toBe('me@example.com')
      expect(body.data.role).toBe('user')
    })

    it('returns 404 when user id does not exist', async () => {
      const res = await app.handle(
        get('/api/auth/me', '550e8400-e29b-41d4-a716-446655440099'),
      )
      expect(res.status).toBe(404)
    })
  })

  // ── Full registration → login → reset lifecycle ──────────

  describe('full lifecycle', () => {
    it('register → login → forgot → reset → login with new pass', async () => {
      // 1. Register
      const regRes = await app.handle(
        post('/api/auth/register', {
          email: 'life@example.com',
          password: 'pass1234',
        }),
      )
      expect(regRes.status).toBe(201)

      // 2. Login
      const loginRes = await app.handle(
        post('/api/auth/login', {
          email: 'life@example.com',
          password: 'pass1234',
        }),
      )
      expect(loginRes.status).toBe(200)
      expect(typeof (await loginRes.json()).data.token).toBe('string')

      // 3. Forgot password
      const forgotRes = await app.handle(
        post('/api/auth/forgot-password', { email: 'life@example.com' }),
      )
      const { resetToken } = (await forgotRes.json()).data

      // 4. Reset password
      const resetRes = await app.handle(
        post('/api/auth/reset-password', {
          token: resetToken,
          newPassword: 'newpass5678',
        }),
      )
      expect(resetRes.status).toBe(200)

      // 5. Old password rejected
      const oldLoginRes = await app.handle(
        post('/api/auth/login', {
          email: 'life@example.com',
          password: 'pass1234',
        }),
      )
      expect(oldLoginRes.status).toBe(401)

      // 6. New password works
      const newLoginRes = await app.handle(
        post('/api/auth/login', {
          email: 'life@example.com',
          password: 'newpass5678',
        }),
      )
      expect(newLoginRes.status).toBe(200)
    })
  })
})
