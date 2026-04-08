import { describe, expect, it } from 'bun:test'
import { ValueObject } from '.././value-object'

class Amount extends ValueObject<number> {
  static create(n: number) { return new Amount(n) }
}

class Name extends ValueObject<string> {
  static create(s: string) { return new Name(s) }
}

describe('ValueObject', () => {
  describe('getValue()', () => {
    it('returns the wrapped value', () => {
      expect(Amount.create(42).getValue()).toBe(42)
    })
  })

  describe('equals()', () => {
    it('returns true for same primitive value', () => {
      expect(Amount.create(5).equals(Amount.create(5))).toBe(true)
    })

    it('returns false for different primitive value', () => {
      expect(Amount.create(5).equals(Amount.create(6))).toBe(false)
    })

    it('compares objects by deep equality', () => {
      class Point extends ValueObject<{ x: number; y: number }> {
        static create(x: number, y: number) { return new Point({ x, y }) }
      }
      expect(Point.create(1, 2).equals(Point.create(1, 2))).toBe(true)
      expect(Point.create(1, 2).equals(Point.create(1, 3))).toBe(false)
    })
  })

  describe('toString()', () => {
    it('returns string representation of the value', () => {
      expect(Amount.create(42).toString()).toBe('42')
      expect(Name.create('hello').toString()).toBe('hello')
    })
  })

  describe('toJSON()', () => {
    it('returns the raw value for serialization', () => {
      expect(Amount.create(7).toJSON()).toBe(7)
      expect(Name.create('world').toJSON()).toBe('world')
    })

    it('is used automatically by JSON.stringify()', () => {
      const result = JSON.parse(JSON.stringify({ amount: Amount.create(99) }))
      expect(result.amount).toBe(99)
    })
  })
})
