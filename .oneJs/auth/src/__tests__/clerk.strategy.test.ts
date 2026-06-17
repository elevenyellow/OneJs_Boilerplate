import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { OneJsError } from '../../errors'
import { UserRoles } from '../types'

// ── Mock @clerk/backend before importing ClerkStrategy ────────────────────────

const mockVerifyToken = mock(
  async (_token: string, _opts: unknown) => ({}) as any,
)
mock.module('@clerk/backend', () => ({ verifyToken: mockVerifyToken }))

const { ClerkStrategy } = await import('../strategies/clerk.strategy')

// ── Helpers ───────────────────────────────────────────────────────────────────

const FRONTEND_KEY = 'pk_test_frontend_key'
const SECRET_KEY = 'sk_test_secret_key'

function makeConfig(overrides: Record<string, string> = {}) {
  const values: Record<string, string> = {
    CLERK_FRONTEND_API_KEY: FRONTEND_KEY,
    CLERK_SECRET_KEY: SECRET_KEY,
    ...overrides,
  }
  return { get: (key: string) => values[key] ?? undefined }
}

function makePayload(overrides: Record<string, unknown> = {}) {
  return {
    sub: 'clerk_user_123',
    email: 'user@example.com',
    publicMetadata: {},
    ...overrides,
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Tests
// ═════════════════════════════════════════════════════════════════════════════

describe('ClerkStrategy', () => {
  let strategy: InstanceType<typeof ClerkStrategy>

  beforeEach(() => {
    mockVerifyToken.mockReset()
    strategy = new ClerkStrategy(makeConfig() as any)
  })

  // ── validate() — happy path ───────────────────────────────────────────────

  describe('validate() — success', () => {
    test('returns AuthUser with correct userId from sub', async () => {
      mockVerifyToken.mockImplementation(async () =>
        makePayload({ sub: 'user_abc' }),
      )

      const result = await strategy.validate('valid-token')

      expect(result.userId).toBe('user_abc')
    })

    test('returns AuthUser with correct email', async () => {
      mockVerifyToken.mockImplementation(async () =>
        makePayload({ email: 'clerk@example.com' }),
      )

      const result = await strategy.validate('valid-token')

      expect(result.email).toBe('clerk@example.com')
    })

    test('defaults role to USER when publicMetadata.role is absent', async () => {
      mockVerifyToken.mockImplementation(async () =>
        makePayload({ publicMetadata: {} }),
      )

      const result = await strategy.validate('valid-token')

      expect(result.role).toBe(UserRoles.USER)
    })

    test('reads role from publicMetadata.role', async () => {
      mockVerifyToken.mockImplementation(async () =>
        makePayload({ publicMetadata: { role: 'admin' } }),
      )

      const result = await strategy.validate('admin-token')

      expect(result.role).toBe('admin')
    })

    test('includes the raw payload in result', async () => {
      const payload = makePayload({ extra: 'meta' })
      mockVerifyToken.mockImplementation(async () => payload)

      const result = await strategy.validate('token')

      expect(result.payload).toEqual(payload)
    })

    test('defaults role to USER when publicMetadata is undefined', async () => {
      mockVerifyToken.mockImplementation(async () => ({
        sub: 'u1',
        email: 'u@example.com',
        // publicMetadata intentionally omitted
      }))

      const result = await strategy.validate('token')

      expect(result.role).toBe(UserRoles.USER)
    })
  })

  // ── validate() — verifyToken call ─────────────────────────────────────────

  describe('validate() — verifyToken call', () => {
    test('calls verifyToken with the raw token string', async () => {
      mockVerifyToken.mockImplementation(async () => makePayload())

      await strategy.validate('my-clerk-token')

      expect(mockVerifyToken).toHaveBeenCalledWith(
        'my-clerk-token',
        expect.any(Object),
      )
    })

    test('passes audience from CLERK_FRONTEND_API_KEY', async () => {
      mockVerifyToken.mockImplementation(async () => makePayload())

      await strategy.validate('token')

      const [, opts] = mockVerifyToken.mock.calls[0] as [string, any]
      expect(opts.audience).toBe(FRONTEND_KEY)
    })

    test('passes secretKey from CLERK_SECRET_KEY', async () => {
      mockVerifyToken.mockImplementation(async () => makePayload())

      await strategy.validate('token')

      const [, opts] = mockVerifyToken.mock.calls[0] as [string, any]
      expect(opts.secretKey).toBe(SECRET_KEY)
    })
  })

  // ── validate() — error handling ───────────────────────────────────────────

  describe('validate() — errors', () => {
    test('throws OneJsError when verifyToken rejects', async () => {
      mockVerifyToken.mockImplementation(async () => {
        throw new Error('jwt expired')
      })

      await expect(strategy.validate('expired-token')).rejects.toBeInstanceOf(
        OneJsError,
      )
    })

    test('throws with 401 status code on invalid token', async () => {
      mockVerifyToken.mockImplementation(async () => {
        throw new Error('invalid signature')
      })

      let thrown: any
      try {
        await strategy.validate('bad-token')
      } catch (e) {
        thrown = e
      }

      expect(thrown).toBeInstanceOf(OneJsError)
      expect(thrown.statusCode).toBe(401)
    })

    test('wraps any error from verifyToken in OneJsError', async () => {
      mockVerifyToken.mockImplementation(async () => {
        throw new TypeError('unexpected shape')
      })

      await expect(strategy.validate('token')).rejects.toBeInstanceOf(
        OneJsError,
      )
    })

    test('does not expose internal verifyToken error message directly', async () => {
      mockVerifyToken.mockImplementation(async () => {
        throw new Error('internal clerk error')
      })

      let thrown: any
      try {
        await strategy.validate('token')
      } catch (e) {
        thrown = e
      }

      // The public message should be generic
      expect(thrown.message).toBe('Unauthorized')
    })
  })
})
