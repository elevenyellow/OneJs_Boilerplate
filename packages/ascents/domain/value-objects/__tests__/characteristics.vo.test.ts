import { describe, expect, test } from 'bun:test'
import { Characteristics } from '../characteristics.vo'
import { CHARACTERISTIC } from '../../mappings'

describe('Characteristics Value Object (Bitmask)', () => {
  describe('createFrom', () => {
    test('should create from bitmask 0 (no characteristics)', () => {
      const chars = Characteristics.createFrom(0)
      expect(chars.getValue()).toBe(0)
      expect(chars.isEmpty()).toBe(true)
      expect(chars.getLabels()).toEqual([])
    })

    test('should create from single flag', () => {
      const chars = Characteristics.createFrom(CHARACTERISTIC.CRUXY)
      expect(chars.getValue()).toBe(1)
      expect(chars.isCruxy()).toBe(true)
      expect(chars.isAthletic()).toBe(false)
    })

    test('should create from combined flags', () => {
      const bitmask =
        CHARACTERISTIC.CRUXY | CHARACTERISTIC.ATHLETIC | CHARACTERISTIC.CRIMPY
      const chars = Characteristics.createFrom(bitmask)

      expect(chars.isCruxy()).toBe(true)
      expect(chars.isAthletic()).toBe(true)
      expect(chars.isCrimpy()).toBe(true)
      expect(chars.hasSlopers()).toBe(false)
      expect(chars.isEndurance()).toBe(false)
      expect(chars.isTechnical()).toBe(false)
    })

    test('should throw error for negative value', () => {
      expect(() => Characteristics.createFrom(-1)).toThrow(
        'Characteristics bitmask cannot be negative',
      )
    })
  })

  describe('fromFlags', () => {
    test('should create from array of flags', () => {
      const chars = Characteristics.fromFlags([
        CHARACTERISTIC.SLOPERS,
        CHARACTERISTIC.ENDURANCE,
      ])

      expect(chars.hasSlopers()).toBe(true)
      expect(chars.isEndurance()).toBe(true)
      expect(chars.getValue()).toBe(
        CHARACTERISTIC.SLOPERS | CHARACTERISTIC.ENDURANCE,
      )
    })

    test('should create none from empty array', () => {
      const chars = Characteristics.fromFlags([])
      expect(chars.isEmpty()).toBe(true)
    })
  })

  describe('getActiveFlags', () => {
    test('should return array of active flags', () => {
      const bitmask = CHARACTERISTIC.TECHNICAL | CHARACTERISTIC.CRIMPY
      const chars = Characteristics.createFrom(bitmask)

      const activeFlags = chars.getActiveFlags()
      expect(activeFlags).toContain(CHARACTERISTIC.TECHNICAL)
      expect(activeFlags).toContain(CHARACTERISTIC.CRIMPY)
      expect(activeFlags).not.toContain(CHARACTERISTIC.CRUXY)
    })
  })

  describe('getLabels', () => {
    test('should return labels for active characteristics', () => {
      const chars = Characteristics.fromFlags([
        CHARACTERISTIC.CRUXY,
        CHARACTERISTIC.TECHNICAL,
      ])

      const labels = chars.getLabels()
      expect(labels).toContain('cruxy')
      expect(labels).toContain('technical')
    })
  })

  describe('equals', () => {
    test('should return true for equal bitmasks', () => {
      const chars1 = Characteristics.createFrom(25)
      const chars2 = Characteristics.createFrom(25)
      expect(chars1.equals(chars2)).toBe(true)
    })

    test('should return false for different bitmasks', () => {
      const chars1 = Characteristics.createFrom(1)
      const chars2 = Characteristics.createFrom(2)
      expect(chars1.equals(chars2)).toBe(false)
    })
  })
})
