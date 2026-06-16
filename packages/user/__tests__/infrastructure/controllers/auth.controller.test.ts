import { OneJsError } from '@OneJs/core'
import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { User } from '../../../domain/entities/user'
import { AuthController } from '../../../infrastructure/controllers/auth.controller'

const UUID = '550e8400-e29b-41d4-a716-446655440000'
const EMAIL = 'user@example.com'
const HASH = '$2b$10$fakehash'

const user = () => User.register(EMAIL, HASH)

function makeService() {
  return {
    register: mock(async (_email: string, _pass: string) => user()),
    login: mock(async (_email: string, _pass: string) => ({
      token: 'jwt.token.here',
      user: user(),
    })),
    forgotPassword: mock(async (_email: string) => UUID as string | null),
    resetPassword: mock(async (_token: string, _pass: string) => {}),
    updatePassword: mock(async (_id: string, _cur: string, _new: string) => {}),
    getById: mock(async (_id: string) => user() as User | null),
  }
}

function makeCtx(overrides: Record<string, unknown> = {}) {
  return { body: {}, set: { status: 200 }, store: {}, ...overrides } as any
}

describe('AuthController', () => {
  let service: ReturnType<typeof makeService>
  let controller: AuthController

  beforeEach(() => {
    service = makeService()
    controller = new AuthController(service as any)
  })

  // ── POST /auth/register ──────────────────────────────────

  describe('register()', () => {
    it('returns 201 with the created user DTO', async () => {
      const ctx = makeCtx({ body: { email: EMAIL, password: 'password123' } })
      const result = await controller.register(ctx)

      expect(ctx.set.status).toBe(201)
      expect((result as any).email).toBe(EMAIL)
    })

    it('throws 400 when email is missing', async () => {
      try {
        await controller.register(
          makeCtx({ body: { password: 'password123' } }),
        )
        expect.unreachable('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(OneJsError)
        expect((err as OneJsError).statusCode).toBe(400)
      }
    })

    it('throws 400 when password is missing', async () => {
      try {
        await controller.register(makeCtx({ body: { email: EMAIL } }))
        expect.unreachable('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(OneJsError)
        expect((err as OneJsError).statusCode).toBe(400)
      }
    })
  })

  // ── POST /auth/login ─────────────────────────────────────

  describe('login()', () => {
    it('returns token and user DTO', async () => {
      const ctx = makeCtx({ body: { email: EMAIL, password: 'password123' } })
      const result = (await controller.login(ctx)) as any

      expect(typeof result.token).toBe('string')
      expect(result.user.email).toBe(EMAIL)
    })

    it('throws 400 when body is missing', async () => {
      try {
        await controller.login(makeCtx())
        expect.unreachable('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(OneJsError)
        expect((err as OneJsError).statusCode).toBe(400)
      }
    })
  })

  // ── POST /auth/forgot-password ───────────────────────────

  describe('forgotPassword()', () => {
    it('returns message and resetToken', async () => {
      const ctx = makeCtx({ body: { email: EMAIL } })
      const result = (await controller.forgotPassword(ctx)) as any

      expect(result.message).toBeDefined()
      expect(result.resetToken).toBe(UUID)
    })

    it('returns message without resetToken when user does not exist', async () => {
      service.forgotPassword = mock(async () => null)
      const ctx = makeCtx({ body: { email: 'nobody@example.com' } })
      const result = (await controller.forgotPassword(ctx)) as any

      expect(result.message).toBeDefined()
      expect(result.resetToken).toBeUndefined()
    })

    it('throws 400 when email is missing', async () => {
      try {
        await controller.forgotPassword(makeCtx())
        expect.unreachable('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(OneJsError)
        expect((err as OneJsError).statusCode).toBe(400)
      }
    })
  })

  // ── POST /auth/reset-password ────────────────────────────

  describe('resetPassword()', () => {
    it('returns success message', async () => {
      const ctx = makeCtx({ body: { token: UUID, newPassword: 'newpass123' } })
      const result = (await controller.resetPassword(ctx)) as any

      expect(result.message).toBeDefined()
    })

    it('throws 400 when token is missing', async () => {
      try {
        await controller.resetPassword(
          makeCtx({ body: { newPassword: 'newpass123' } }),
        )
        expect.unreachable('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(OneJsError)
        expect((err as OneJsError).statusCode).toBe(400)
      }
    })
  })

  // ── PATCH /auth/password ─────────────────────────────────

  describe('updatePassword()', () => {
    it('returns success message', async () => {
      const ctx = makeCtx({
        body: { currentPassword: 'old123456', newPassword: 'new123456' },
        store: { user: { userId: UUID } },
      })
      const result = (await controller.updatePassword(ctx)) as any

      expect(result.message).toBeDefined()
    })

    it('throws 400 when currentPassword is missing', async () => {
      try {
        await controller.updatePassword(
          makeCtx({
            body: { newPassword: 'new123456' },
            store: { user: { userId: UUID } },
          }),
        )
        expect.unreachable('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(OneJsError)
        expect((err as OneJsError).statusCode).toBe(400)
      }
    })
  })

  // ── GET /auth/me ─────────────────────────────────────────

  describe('me()', () => {
    it('returns the authenticated user DTO', async () => {
      const ctx = makeCtx({ store: { user: { userId: UUID } } })
      const result = (await controller.me(ctx)) as any

      expect(result.email).toBe(EMAIL)
    })

    it('throws 404 when user is not found', async () => {
      service.getById = mock(async () => null)

      try {
        await controller.me(makeCtx({ store: { user: { userId: UUID } } }))
        expect.unreachable('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(OneJsError)
        expect((err as OneJsError).statusCode).toBe(404)
      }
    })
  })
})
