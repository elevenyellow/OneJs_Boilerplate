/**
 * Integration tests: AuthMiddleware + ClerkStrategy (verifyToken mocked)
 *
 * Tests the full middleware → strategy pipeline without a running server.
 * `verifyToken` from @clerk/backend is mocked; everything else is real.
 */
import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { OneJsError } from '../../errors'
import { UserRoles } from '../types'

// ── Mock @clerk/backend before importing strategy ─────────────────────────────

const mockVerifyToken = mock(
  async (_token: string, _opts: unknown) => ({}) as Record<string, unknown>,
)
mock.module('@clerk/backend', () => ({ verifyToken: mockVerifyToken }))

const { ClerkStrategy } = await import('../strategies/clerk.strategy')
const { AuthMiddleware } = await import('../auth.middleware')

// ── Types ─────────────────────────────────────────────────────────────────────

type MiddlewareCtx = {
  request: { headers: { get: (key: string) => string | null } }
  set: { status: number }
  store: Record<string, unknown>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeConfig() {
  return {
    get: (key: string): string | undefined =>
      ({
        CLERK_FRONTEND_API_KEY: 'pk_test_key',
        CLERK_SECRET_KEY: 'sk_test_secret',
      })[key],
  }
}

function makeLogger() {
  const noop = () => {
    return
  }
  return { debug: noop, info: noop, warn: noop, error: noop }
}

function makeContext(
  authHeader?: string,
  store: Record<string, unknown> = {},
): MiddlewareCtx {
  return {
    request: {
      headers: {
        get: (key: string) =>
          key === 'authorization' ? (authHeader ?? null) : null,
      },
    },
    set: { status: 200 },
    store,
  }
}

function makeClerkPayload(overrides: Record<string, unknown> = {}) {
  return {
    sub: 'clerk_user_abc',
    email: 'clerk@example.com',
    publicMetadata: {},
    ...overrides,
  }
}

function makeMiddleware() {
  const strategy = new ClerkStrategy(
    makeConfig() as unknown as InstanceType<typeof ClerkStrategy>,
  )
  return new AuthMiddleware(
    strategy as unknown as ConstructorParameters<typeof AuthMiddleware>[0],
    makeLogger() as unknown as ConstructorParameters<typeof AuthMiddleware>[1],
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Tests
// ═════════════════════════════════════════════════════════════════════════════

describe('AuthMiddleware + ClerkStrategy (integration)', () => {
  let middleware: InstanceType<typeof AuthMiddleware>

  beforeEach(() => {
    mockVerifyToken.mockReset()
    middleware = makeMiddleware()
  })

  // ── Token validation ──────────────────────────────────────────────────────

  describe('token validation', () => {
    test('passes validated user into context.store.user', async () => {
      mockVerifyToken.mockImplementation(async () =>
        makeClerkPayload({ sub: 'u1', email: 'u@test.com' }),
      )
      const ctx = makeContext('Bearer clerk-token')

      await middleware.handle(ctx)

      expect(ctx.store.user).toMatchObject({
        userId: 'u1',
        email: 'u@test.com',
      })
    })

    test('strips Bearer prefix before passing to ClerkStrategy', async () => {
      mockVerifyToken.mockImplementation(async () => makeClerkPayload())
      const ctx = makeContext('Bearer my-clerk-jwt')

      await middleware.handle(ctx)

      expect(mockVerifyToken).toHaveBeenCalledWith(
        'my-clerk-jwt',
        expect.any(Object),
      )
    })

    test('throws 401 when no Authorization header is present', async () => {
      const ctx = makeContext(undefined)

      let thrown: unknown
      try {
        await middleware.handle(ctx)
      } catch (e) {
        thrown = e
      }

      expect(thrown).toBeInstanceOf(OneJsError)
      expect((thrown as OneJsError).statusCode).toBe(401)
      expect(ctx.set.status).toBe(401)
    })

    test('throws 401 when scheme is not Bearer', async () => {
      const ctx = makeContext('Token some-value')

      await expect(middleware.handle(ctx)).rejects.toBeInstanceOf(OneJsError)
    })

    test('throws 401 when Clerk token is expired', async () => {
      mockVerifyToken.mockImplementation(async () => {
        throw new Error('jwt expired')
      })
      const ctx = makeContext('Bearer expired-token')

      let thrown: unknown
      try {
        await middleware.handle(ctx)
      } catch (e) {
        thrown = e
      }

      expect(thrown).toBeInstanceOf(OneJsError)
      expect((thrown as OneJsError).statusCode).toBe(401)
      // Note: ClerkStrategy throws OneJsError → middleware re-throws it directly
      // without setting ctx.set.status (only generic Errors trigger that path).
    })

    test('throws 401 when Clerk token has invalid signature', async () => {
      mockVerifyToken.mockImplementation(async () => {
        throw new Error('invalid signature')
      })
      const ctx = makeContext('Bearer tampered-token')

      await expect(middleware.handle(ctx)).rejects.toBeInstanceOf(OneJsError)
    })

    test('always throws OneJsError (ClerkStrategy wraps all errors)', async () => {
      // ClerkStrategy catches any verifyToken rejection and re-throws as OneJsError.
      // AuthMiddleware then re-throws it directly (instanceof check), so the error
      // always surfaces as OneJsError regardless of what verifyToken throws.
      mockVerifyToken.mockImplementation(async () => {
        throw new TypeError('unexpected network error')
      })
      const ctx = makeContext('Bearer token')

      let thrown: unknown
      try {
        await middleware.handle(ctx)
      } catch (e) {
        thrown = e
      }

      expect(thrown).toBeInstanceOf(OneJsError)
      expect((thrown as OneJsError).statusCode).toBe(401)
    })
  })

  // ── Role-based access control ─────────────────────────────────────────────

  describe('role checking', () => {
    test('allows access when Clerk user has the required role', async () => {
      mockVerifyToken.mockImplementation(async () =>
        makeClerkPayload({ publicMetadata: { role: 'admin' } }),
      )
      const ctx = makeContext('Bearer admin-token')

      await expect(middleware.handle(ctx, ['admin'])).resolves.toBeUndefined()
    })

    test('throws 403 when Clerk user role does not match required', async () => {
      mockVerifyToken.mockImplementation(async () =>
        makeClerkPayload({ publicMetadata: {} }),
      )
      const ctx = makeContext('Bearer user-token')

      let thrown: unknown
      try {
        await middleware.handle(ctx, ['admin'])
      } catch (e) {
        thrown = e
      }

      expect(thrown).toBeInstanceOf(OneJsError)
      expect((thrown as OneJsError).statusCode).toBe(403)
      expect(ctx.set.status).toBe(403)
    })

    test('allows access when no required roles are specified', async () => {
      mockVerifyToken.mockImplementation(async () => makeClerkPayload())
      const ctx = makeContext('Bearer token')

      await expect(middleware.handle(ctx)).resolves.toBeUndefined()
    })

    test('allows access with empty requiredRoles array', async () => {
      mockVerifyToken.mockImplementation(async () => makeClerkPayload())
      const ctx = makeContext('Bearer token')

      await expect(middleware.handle(ctx, [])).resolves.toBeUndefined()
    })

    test('staff role can access staff-only route', async () => {
      mockVerifyToken.mockImplementation(async () =>
        makeClerkPayload({ publicMetadata: { role: UserRoles.STAFF } }),
      )
      const ctx = makeContext('Bearer staff-token')

      await expect(
        middleware.handle(ctx, [UserRoles.STAFF]),
      ).resolves.toBeUndefined()
    })
  })

  // ── User data propagation ─────────────────────────────────────────────────

  describe('user data propagation', () => {
    test('sets correct userId on context.store.user', async () => {
      mockVerifyToken.mockImplementation(async () =>
        makeClerkPayload({ sub: 'clerk_specific_id' }),
      )
      const ctx = makeContext('Bearer token')

      await middleware.handle(ctx)

      expect((ctx.store.user as Record<string, unknown>)?.userId).toBe(
        'clerk_specific_id',
      )
    })

    test('sets correct role on context.store.user', async () => {
      mockVerifyToken.mockImplementation(async () =>
        makeClerkPayload({ publicMetadata: { role: 'staff' } }),
      )
      const ctx = makeContext('Bearer token')

      await middleware.handle(ctx)

      expect((ctx.store.user as Record<string, unknown>)?.role).toBe('staff')
    })

    test('defaults to USER role when no role in metadata', async () => {
      mockVerifyToken.mockImplementation(async () =>
        makeClerkPayload({ publicMetadata: {} }),
      )
      const ctx = makeContext('Bearer token')

      await middleware.handle(ctx)

      expect((ctx.store.user as Record<string, unknown>)?.role).toBe(
        UserRoles.USER,
      )
    })
  })
})
