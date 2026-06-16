import { describe, expect, it } from 'bun:test'
import { User } from '../../../domain/entities/user'

const HASH = '$2b$10$fakehash'
const EMAIL = 'user@example.com'

describe('User', () => {
  describe('register()', () => {
    it('creates a user with role=user, no resetToken, and a valid id', () => {
      const user = User.register(EMAIL, HASH)

      expect(user.getId().getValue()).toMatch(
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/,
      )
      expect(user.email.getValue()).toBe(EMAIL)
      expect(user.role.getValue()).toBe('user')
      expect(user.resetToken).toBeNull()
    })
  })

  describe('withPasswordHash()', () => {
    it('returns a new instance with updated hash and clears resetToken', () => {
      const user = User.register(EMAIL, HASH)
      const withToken = user.withResetToken(
        '550e8400-e29b-41d4-a716-446655440000',
      )
      const updated = withToken.withPasswordHash('$2b$10$newhash')

      expect(updated.passwordHash.getValue()).toBe('$2b$10$newhash')
      expect(updated.resetToken).toBeNull()
      expect(updated.getId().getValue()).toBe(user.getId().getValue())
    })

    it('does not mutate the original', () => {
      const user = User.register(EMAIL, HASH)
      user.withPasswordHash('$2b$10$newhash')
      expect(user.passwordHash.getValue()).toBe(HASH)
    })
  })

  describe('withResetToken()', () => {
    it('sets a reset token', () => {
      const user = User.register(EMAIL, HASH)
      const token = '550e8400-e29b-41d4-a716-446655440000'
      const updated = user.withResetToken(token)

      expect(updated.resetToken?.getValue()).toBe(token)
    })

    it('clears reset token when passed null', () => {
      const user = User.register(EMAIL, HASH)
        .withResetToken('550e8400-e29b-41d4-a716-446655440000')
        .withResetToken(null)

      expect(user.resetToken).toBeNull()
    })
  })

  describe('toDto()', () => {
    it('returns a DTO with id, email, role, and createdAt — no passwordHash', () => {
      const user = User.register(EMAIL, HASH)
      const dto = user.toDto()

      expect(dto.id).toBe(user.getId().getValue())
      expect(dto.email).toBe(EMAIL)
      expect(dto.role).toBe('user')
      expect(dto.createdAt).toBeInstanceOf(Date)
      expect((dto as any).passwordHash).toBeUndefined()
    })
  })
})
