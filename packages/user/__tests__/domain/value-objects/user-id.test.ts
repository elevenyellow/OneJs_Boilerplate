import { OneJsError } from '@OneJs/core'
import { describe, expect, it } from 'bun:test'
import { UserId } from '../../../domain/value-objects/user-id'

describe('UserId', () => {
  describe('generateUniqueId()', () => {
    it('generates a valid UUID v4', () => {
      const id = UserId.generateUniqueId()
      expect(id.getValue()).toMatch(
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/,
      )
    })

    it('generates unique values on each call', () => {
      const a = UserId.generateUniqueId()
      const b = UserId.generateUniqueId()
      expect(a.getValue()).not.toBe(b.getValue())
    })
  })

  describe('fromString()', () => {
    it('creates UserId from a valid UUID v4', () => {
      const raw = '550e8400-e29b-41d4-a716-446655440000'
      const id = UserId.fromString(raw)
      expect(id.getValue()).toBe(raw)
    })

    it('throws on empty string', () => {
      expect(() => UserId.fromString('')).toThrow(OneJsError)
    })

    it('throws on invalid UUID format', () => {
      expect(() => UserId.fromString('not-a-uuid')).toThrow(OneJsError)
    })
  })
})
