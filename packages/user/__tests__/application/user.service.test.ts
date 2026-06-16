import { OneJsError } from '@OneJs/core'
import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { UserService } from '../../application/user.service'
import { User } from '../../domain/entities/user'

const HASH = '$2b$10$fakehashvalue'
const EMAIL = 'test@example.com'
const UUID = '550e8400-e29b-41d4-a716-446655440000'

function makeUser(email = EMAIL) {
  return User.register(email, HASH)
}

function makeRepo() {
  return {
    findAll: mock(async () => [] as User[]),
    findById: mock(async (_id: string) => null as User | null),
    findByEmail: mock(async (_email: string) => null as User | null),
    findByResetToken: mock(async (_token: string) => null as User | null),
    save: mock(async (_user: User) => {}),
    delete: mock(async (_id: string) => {}),
  }
}

function makeEventBus() {
  return { publish: mock(async () => {}) }
}

function makeConfigService() {
  return { get: mock((_key: string) => 'test_secret') }
}

function makeLogger() {
  return {
    debug: mock(() => {}),
    info: mock(() => {}),
    warn: mock(() => {}),
    error: mock(() => {}),
  }
}

describe('UserService', () => {
  let repo: ReturnType<typeof makeRepo>
  let eventBus: ReturnType<typeof makeEventBus>
  let service: UserService

  beforeEach(() => {
    repo = makeRepo()
    eventBus = makeEventBus()
    service = new UserService(
      repo as any,
      eventBus as any,
      makeConfigService() as any,
      makeLogger() as any,
    )
  })

  // ── register ──────────────────────────────────────────────

  describe('register()', () => {
    it('saves a new user and publishes UserRegisteredEvent', async () => {
      const user = await service.register(EMAIL, 'password123')

      expect(repo.save.mock.calls).toHaveLength(1)
      expect(eventBus.publish.mock.calls).toHaveLength(1)
      expect(user.email.getValue()).toBe(EMAIL)
      expect(user.role.getValue()).toBe('user')
    })

    it('throws 409 when email already exists', async () => {
      repo.findByEmail = mock(async () => makeUser())

      try {
        await service.register(EMAIL, 'password123')
        expect.unreachable('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(OneJsError)
        expect((err as OneJsError).statusCode).toBe(409)
      }
    })

    it('throws 400 when password is too short', async () => {
      try {
        await service.register(EMAIL, 'short')
        expect.unreachable('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(OneJsError)
        expect((err as OneJsError).statusCode).toBe(400)
      }
    })
  })

  // ── login ─────────────────────────────────────────────────

  describe('login()', () => {
    it('returns a JWT token and the user on valid credentials', async () => {
      const password = 'password123'
      const hash = await Bun.password.hash(password)
      const user = User.register(EMAIL, hash)
      repo.findByEmail = mock(async () => user)

      const result = await service.login(EMAIL, password)

      expect(typeof result.token).toBe('string')
      expect(result.user.email.getValue()).toBe(EMAIL)
    })

    it('throws 401 when user is not found', async () => {
      try {
        await service.login(EMAIL, 'password123')
        expect.unreachable('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(OneJsError)
        expect((err as OneJsError).statusCode).toBe(401)
      }
    })

    it('throws 401 when password is wrong', async () => {
      const hash = await Bun.password.hash('correct-password')
      repo.findByEmail = mock(async () => User.register(EMAIL, hash))

      try {
        await service.login(EMAIL, 'wrong-password')
        expect.unreachable('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(OneJsError)
        expect((err as OneJsError).statusCode).toBe(401)
      }
    })
  })

  // ── forgotPassword ────────────────────────────────────────

  describe('forgotPassword()', () => {
    it('returns a reset token and saves the updated user', async () => {
      repo.findByEmail = mock(async () => makeUser())

      const token = await service.forgotPassword(EMAIL)

      expect(typeof token).toBe('string')
      expect(repo.save.mock.calls).toHaveLength(1)
      expect(eventBus.publish.mock.calls).toHaveLength(1)
    })

    it('returns null silently when email does not exist', async () => {
      const token = await service.forgotPassword('nobody@example.com')
      expect(token).toBeNull()
      expect(repo.save.mock.calls).toHaveLength(0)
    })
  })

  // ── resetPassword ─────────────────────────────────────────

  describe('resetPassword()', () => {
    it('updates the password and clears the reset token', async () => {
      const user = makeUser().withResetToken(UUID)
      repo.findByResetToken = mock(async () => user)

      await service.resetPassword(UUID, 'newpassword123')

      expect(repo.save.mock.calls).toHaveLength(1)
      const saved = repo.save.mock.calls[0][0] as User
      expect(saved.resetToken).toBeNull()
    })

    it('throws 400 on invalid token', async () => {
      try {
        await service.resetPassword('bad-token', 'newpassword123')
        expect.unreachable('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(OneJsError)
        expect((err as OneJsError).statusCode).toBe(400)
      }
    })

    it('throws 400 when new password is too short', async () => {
      repo.findByResetToken = mock(async () => makeUser().withResetToken(UUID))

      try {
        await service.resetPassword(UUID, 'short')
        expect.unreachable('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(OneJsError)
        expect((err as OneJsError).statusCode).toBe(400)
      }
    })
  })

  // ── updatePassword ────────────────────────────────────────

  describe('updatePassword()', () => {
    it('updates the password when current password is correct', async () => {
      const password = 'current-pass'
      const hash = await Bun.password.hash(password)
      repo.findById = mock(async () => User.register(EMAIL, hash))

      await service.updatePassword(UUID, password, 'new-password-123')

      expect(repo.save.mock.calls).toHaveLength(1)
      expect(eventBus.publish.mock.calls).toHaveLength(1)
    })

    it('throws 404 when user does not exist', async () => {
      try {
        await service.updatePassword(UUID, 'current', 'new-password-123')
        expect.unreachable('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(OneJsError)
        expect((err as OneJsError).statusCode).toBe(404)
      }
    })

    it('throws 401 when current password is wrong', async () => {
      const hash = await Bun.password.hash('correct-pass')
      repo.findById = mock(async () => User.register(EMAIL, hash))

      try {
        await service.updatePassword(UUID, 'wrong-pass', 'new-password-123')
        expect.unreachable('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(OneJsError)
        expect((err as OneJsError).statusCode).toBe(401)
      }
    })
  })
})
