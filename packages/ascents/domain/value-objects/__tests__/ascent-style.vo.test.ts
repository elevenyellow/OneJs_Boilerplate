import { describe, expect, test } from 'bun:test'
import { AscentStyle } from '../ascent-style.vo'
import { ASCENT_STYLE } from '../../mappings'

describe('AscentStyle Value Object', () => {
  describe('createFrom', () => {
    test('should create onsight style from value 0', () => {
      const style = AscentStyle.createFrom(0)
      expect(style.getValue()).toBe(ASCENT_STYLE.ONSIGHT)
      expect(style.isOnsight()).toBe(true)
      expect(style.getLabel()).toBe('onsight')
    })

    test('should create flash style from value 1', () => {
      const style = AscentStyle.createFrom(1)
      expect(style.getValue()).toBe(ASCENT_STYLE.FLASH)
      expect(style.isFlash()).toBe(true)
      expect(style.getLabel()).toBe('flash')
    })

    test('should create redpoint style from value 2', () => {
      const style = AscentStyle.createFrom(2)
      expect(style.getValue()).toBe(ASCENT_STYLE.REDPOINT)
      expect(style.isRedpoint()).toBe(true)
      expect(style.getLabel()).toBe('redpoint')
    })

    test('should create go style from value 3', () => {
      const style = AscentStyle.createFrom(3)
      expect(style.getValue()).toBe(ASCENT_STYLE.GO)
      expect(style.isGo()).toBe(true)
      expect(style.getLabel()).toBe('go')
    })

    test('should create toprope style from value 4', () => {
      const style = AscentStyle.createFrom(4)
      expect(style.getValue()).toBe(ASCENT_STYLE.TOPROPE)
      expect(style.isToprope()).toBe(true)
      expect(style.getLabel()).toBe('toprope')
    })

    test('should throw error for invalid value', () => {
      expect(() => AscentStyle.createFrom(5)).toThrow('Invalid ascent style: 5')
      expect(() => AscentStyle.createFrom(-1)).toThrow(
        'Invalid ascent style: -1',
      )
    })
  })

  describe('factory methods', () => {
    test('should create onsight via factory method', () => {
      const style = AscentStyle.onsight()
      expect(style.isOnsight()).toBe(true)
    })

    test('should create flash via factory method', () => {
      const style = AscentStyle.flash()
      expect(style.isFlash()).toBe(true)
    })

    test('should create redpoint via factory method', () => {
      const style = AscentStyle.redpoint()
      expect(style.isRedpoint()).toBe(true)
    })
  })

  describe('equals', () => {
    test('should return true for equal styles', () => {
      const style1 = AscentStyle.createFrom(2)
      const style2 = AscentStyle.redpoint()
      expect(style1.equals(style2)).toBe(true)
    })

    test('should return false for different styles', () => {
      const style1 = AscentStyle.onsight()
      const style2 = AscentStyle.flash()
      expect(style1.equals(style2)).toBe(false)
    })
  })
})
