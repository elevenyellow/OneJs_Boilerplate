import { OneJsError } from '@OneJs/core'
import { describe, expect, it } from 'bun:test'
import { PasswordHash } from '../../../domain/value-objects/password-hash'

describe('PasswordHash', () => {
  describe('create()', () => {
    it('wraps a valid hash string', () => {
      const hash = '$2b$10$somebcrypthashvalue'
      const vo = PasswordHash.create(hash)
      expect(vo.getValue()).toBe(hash)
    })

    it('throws on empty string', () => {
      expect(() => PasswordHash.create('')).toThrow(OneJsError)
    })

    it('throws on whitespace-only string', () => {
      expect(() => PasswordHash.create('   ')).toThrow(OneJsError)
    })
  })
})
