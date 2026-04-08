/**
 * E2E tests: Elysia HTTP pipeline → AuthMiddleware (ClerkStrategy) → handler
 *
 * Uses Elysia's `handle()` to process real HTTP Requests through the full
 * routing + auth pipeline. `verifyToken` from @clerk/backend is mocked;
 * AuthMiddleware and ClerkStrategy are real.
 *
 * Routes under test:
 *   GET  /public     → no auth required
 *   GET  /protected  → Clerk JWT required, returns ctx.store.user
 *   GET  /admin      → Clerk JWT + admin role required
 */
import { mock, beforeEach, describe, test, expect } from 'bun:test'
import { Elysia } from 'elysia'
import { UserRoles } from '../types'

// ── Mock @clerk/backend before importing strategy ─────────────────────────────

const mockVerifyToken = mock(async (_token: string, _opts: unknown) => ({} as Record<string, unknown>))
mock.module('@clerk/backend', () => ({ verifyToken: mockVerifyToken }))

const { ClerkStrategy } = await import('../strategies/clerk.strategy')
const { AuthMiddleware } = await import('../auth.middleware')

// ── Helpers ───────────────────────────────────────────────────────────────────

const BASE = 'http://test'

function makeLogger() {
  return { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} }
}

function makeConfig() {
  return {
    get: (key: string): string | undefined =>
      ({
        CLERK_FRONTEND_API_KEY: 'pk_test_key',
        CLERK_SECRET_KEY: 'sk_test_secret',
      })[key],
  }
}

function makeClerkPayload(
  userId: string,
  role = UserRoles.USER,
  overrides: Record<string, unknown> = {},
) {
  return {
    sub: userId,
    email: `${userId}@test.com`,
    publicMetadata: { role: role !== UserRoles.USER ? role : undefined },
    ...overrides,
  }
}

// ── Elysia app factory ────────────────────────────────────────────────────────

// biome-ignore lint/suspicious/noExplicitAny: test utilities need loose typing for DI mocks
type AnyCtx = any

function createApp() {
  // biome-ignore lint/suspicious/noExplicitAny: mocks for DI-injected deps
  const strategy = new ClerkStrategy(makeConfig() as any)
  // biome-ignore lint/suspicious/noExplicitAny: mocks for DI-injected deps
  const authMiddleware = new AuthMiddleware(strategy as any, makeLogger() as any)

  async function requireAuth(ctx: AnyCtx, requiredRoles?: string[]) {
    await authMiddleware.handle(ctx, requiredRoles)
  }

  return new Elysia()
    .onError(({ error, set }) => {
      // biome-ignore lint/suspicious/noExplicitAny: error shape from OneJsError
      const err = error as any
      if (typeof err.statusCode === 'number') {
        set.status = err.statusCode
        return {
          success: false,
          error: { statusCode: err.statusCode, code: err.code, message: err.explanatoryMessage },
        }
      }
      set.status = 500
      return { success: false, error: { statusCode: 500 } }
    })
    .get('/public', () => ({ success: true, data: 'public content' }))
    // biome-ignore lint/suspicious/noExplicitAny: ctx.store shape set by authMiddleware
    .get('/protected', (ctx) => ({ success: true, data: (ctx.store as any).user }), {
      beforeHandle: (ctx) => requireAuth(ctx),
    })
    // biome-ignore lint/suspicious/noExplicitAny: ctx.store shape set by authMiddleware
    .get('/admin', (ctx) => ({ success: true, data: (ctx.store as any).user }), {
      beforeHandle: (ctx) => requireAuth(ctx, ['admin']),
    })
}

function getReq(path: string, token?: string) {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return new Request(`${BASE}${path}`, { method: 'GET', headers })
}

// ═════════════════════════════════════════════════════════════════════════════
// Tests
// ═════════════════════════════════════════════════════════════════════════════

describe('Clerk Auth — E2E (Elysia handle)', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    mockVerifyToken.mockReset()
    app = createApp()
  })

  // ── Public route ──────────────────────────────────────────────────────────

  describe('GET /public', () => {
    test('returns 200 without any token', async () => {
      const res = await app.handle(getReq('/public'))

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toBe('public content')
    })

    test('returns 200 even when token is present (ignored)', async () => {
      const res = await app.handle(getReq('/public', 'some-token'))

      expect(res.status).toBe(200)
    })
  })

  // ── Protected route — no / invalid token ─────────────────────────────────

  describe('GET /protected — missing token', () => {
    test('returns 401 when Authorization header is absent', async () => {
      const res = await app.handle(getReq('/protected'))

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error.code).toBe('AUTH_MISSING')
    })

    test('returns 401 when scheme is not Bearer', async () => {
      const res = await app.handle(
        new Request(`${BASE}/protected`, {
          headers: { Authorization: 'Basic dXNlcjpwYXNz' },
        }),
      )
      expect(res.status).toBe(401)
    })

    test('returns 401 when Clerk token is expired', async () => {
      mockVerifyToken.mockImplementation(async () => {
        throw new Error('jwt expired')
      })

      const res = await app.handle(getReq('/protected', 'expired-token'))

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error.code).toBe('AUTH_INVALID')
    })

    test('returns 401 when Clerk token has invalid signature', async () => {
      mockVerifyToken.mockImplementation(async () => {
        throw new Error('invalid signature')
      })

      const res = await app.handle(getReq('/protected', 'tampered'))

      expect(res.status).toBe(401)
    })
  })

  // ── Protected route — valid token ─────────────────────────────────────────

  describe('GET /protected — valid Clerk token', () => {
    test('returns 200 and injects user into response', async () => {
      mockVerifyToken.mockImplementation(async () =>
        makeClerkPayload('user_123'),
      )

      const res = await app.handle(getReq('/protected', 'valid-clerk-jwt'))

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.userId).toBe('user_123')
    })

    test('propagates email from Clerk payload', async () => {
      mockVerifyToken.mockImplementation(async () =>
        makeClerkPayload('user_abc', UserRoles.USER, { email: 'clerk@example.com' }),
      )

      const res = await app.handle(getReq('/protected', 'token'))

      const body = await res.json()
      expect(body.data.email).toBe('clerk@example.com')
    })

    test('defaults role to USER when publicMetadata.role is absent', async () => {
      mockVerifyToken.mockImplementation(async () => ({
        sub: 'user_xyz',
        email: 'u@test.com',
        publicMetadata: {},
      }))

      const res = await app.handle(getReq('/protected', 'token'))

      const body = await res.json()
      expect(body.data.role).toBe(UserRoles.USER)
    })

    test('uses role from publicMetadata.role', async () => {
      mockVerifyToken.mockImplementation(async () => ({
        sub: 'admin_123',
        email: 'admin@test.com',
        publicMetadata: { role: 'admin' },
      }))

      const res = await app.handle(getReq('/protected', 'admin-token'))

      const body = await res.json()
      expect(body.data.role).toBe('admin')
    })
  })

  // ── Admin route — role-based access ──────────────────────────────────────

  describe('GET /admin — role-based access', () => {
    test('returns 200 when user has admin role', async () => {
      mockVerifyToken.mockImplementation(async () => ({
        sub: 'admin_1',
        email: 'admin@test.com',
        publicMetadata: { role: 'admin' },
      }))

      const res = await app.handle(getReq('/admin', 'admin-token'))

      expect(res.status).toBe(200)
    })

    test('returns 403 when user has USER role (insufficient)', async () => {
      mockVerifyToken.mockImplementation(async () =>
        makeClerkPayload('user_1', UserRoles.USER),
      )

      const res = await app.handle(getReq('/admin', 'user-token'))

      expect(res.status).toBe(403)
    })

    test('returns 403 when user has staff role but admin is required', async () => {
      mockVerifyToken.mockImplementation(async () => ({
        sub: 'staff_1',
        email: 'staff@test.com',
        publicMetadata: { role: UserRoles.STAFF },
      }))

      const res = await app.handle(getReq('/admin', 'staff-token'))

      expect(res.status).toBe(403)
    })

    test('returns 401 when no token provided to admin route', async () => {
      const res = await app.handle(getReq('/admin'))

      expect(res.status).toBe(401)
    })
  })

  // ── verifyToken call contract ─────────────────────────────────────────────

  describe('verifyToken call contract', () => {
    test('passes the raw token (without Bearer prefix) to Clerk', async () => {
      mockVerifyToken.mockImplementation(async () => makeClerkPayload('u1'))

      await app.handle(getReq('/protected', 'my-raw-clerk-jwt'))

      expect(mockVerifyToken).toHaveBeenCalledWith(
        'my-raw-clerk-jwt',
        expect.any(Object),
      )
    })

    test('passes configured API key and secret to Clerk', async () => {
      mockVerifyToken.mockImplementation(async () => makeClerkPayload('u1'))

      await app.handle(getReq('/protected', 'token'))

      // biome-ignore lint/suspicious/noExplicitAny: mock call args are untyped
      const [, opts] = mockVerifyToken.mock.calls[0] as [string, any]
      expect(opts.audience).toBe('pk_test_key')
      expect(opts.secretKey).toBe('sk_test_secret')
    })
  })
})
