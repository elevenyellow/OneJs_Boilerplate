import { describe, expect, it } from 'bun:test'
import { OneJsError } from '@OneJs/core'
import { Email } from '../../../domain/value-objects/email'

describe('Email', () => {
  describe('create()', () => {
    it('creates a valid email and normalizes to lowercase', () => {
      const email = Email.create('User@Example.COM')
      expect(email.getValue()).toBe('user@example.com')
    })

    it('trims whitespace', () => {
      const email = Email.create('  test@example.com  ')
      expect(email.getValue()).toBe('test@example.com')
    })

    it('throws on empty string', () => {
      expect(() => Email.create('')).toThrow(OneJsError)
    })

    it('throws on whitespace-only string', () => {
      expect(() => Email.create('   ')).toThrow(OneJsError)
    })

    it('throws on missing @ symbol', () => {
      expect(() => Email.create('notanemail')).toThrow(OneJsError)
    })

    it('throws on missing domain', () => {
      expect(() => Email.create('user@')).toThrow(OneJsError)
    })

    it('throws on missing TLD', () => {
      expect(() => Email.create('user@domain')).toThrow(OneJsError)
    })

    it('throws when exceeding max length', () => {
      const long = `${'a'.repeat(250)}@b.com`
      expect(() => Email.create(long)).toThrow(OneJsError)
    })
  })
})
