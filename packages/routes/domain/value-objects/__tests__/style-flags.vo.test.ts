import { describe, expect, test } from 'bun:test'
import { ClimbingStyle, StyleFlags } from '../style-flags.vo'

describe('StyleFlags Value Object', () => {
  describe('createFrom (numeric value)', () => {
    test('should create from numeric bitmask', () => {
      // Sport (1) + Trad (2) = 3
      const flags = StyleFlags.createFrom(3)

      expect(flags.isSport()).toBe(true)
      expect(flags.isTrad()).toBe(true)
      expect(flags.isBoulder()).toBe(false)
      expect(flags.getValue()).toBe(3)
    })

    test('should handle null as empty', () => {
      const flags = StyleFlags.createFrom(null)

      expect(flags.isEmpty()).toBe(true)
      expect(flags.getValue()).toBe(0)
    })

    test('should handle undefined as empty', () => {
      const flags = StyleFlags.createFrom(undefined)

      expect(flags.isEmpty()).toBe(true)
      expect(flags.getValue()).toBe(0)
    })

    test('should handle zero as empty', () => {
      const flags = StyleFlags.createFrom(0)

      expect(flags.isEmpty()).toBe(true)
      expect(flags.getValue()).toBe(0)
    })

    test('should handle all styles combined', () => {
      // All styles: 1 + 2 + 4 + 8 + 16 + 32 + 64 + 128 = 255
      const flags = StyleFlags.createFrom(255)

      expect(flags.isSport()).toBe(true)
      expect(flags.isTrad()).toBe(true)
      expect(flags.isBoulder()).toBe(true)
      expect(flags.isAid()).toBe(true)
      expect(flags.isAlpine()).toBe(true)
      expect(flags.isMixed()).toBe(true)
      expect(flags.isIce()).toBe(true)
      expect(flags.isTopRope()).toBe(true)
      expect(flags.getStyleCount()).toBe(8)
    })
  })

  describe('createFromData (scraper format)', () => {
    test('should create from scraper data with IsSport', () => {
      const flags = StyleFlags.createFromData({ IsSport: 1 })

      expect(flags.isSport()).toBe(true)
      expect(flags.isTrad()).toBe(false)
      expect(flags.getValue()).toBe(ClimbingStyle.SPORT)
    })

    test('should create from multiple scraper flags', () => {
      const flags = StyleFlags.createFromData({
        IsSport: 1,
        IsTrad: 1,
        IsBoulder: 1,
      })

      expect(flags.isSport()).toBe(true)
      expect(flags.isTrad()).toBe(true)
      expect(flags.isBoulder()).toBe(true)
      expect(flags.isAid()).toBe(false)
      expect(flags.getValue()).toBe(7) // 1 + 2 + 4
    })

    test('should handle null data as empty', () => {
      const flags = StyleFlags.createFromData(null)

      expect(flags.isEmpty()).toBe(true)
    })

    test('should ignore zero values in data', () => {
      const flags = StyleFlags.createFromData({
        IsSport: 1,
        IsTrad: 0,
      })

      expect(flags.isSport()).toBe(true)
      expect(flags.isTrad()).toBe(false)
    })
  })

  describe('createFromBooleans', () => {
    test('should create from boolean values', () => {
      const flags = StyleFlags.createFromBooleans(
        true, // sport
        false, // trad
        true, // boulder
        false, // aid
        false, // alpine
        false, // mixed
        false, // ice
        false, // topRope
      )

      expect(flags.isSport()).toBe(true)
      expect(flags.isTrad()).toBe(false)
      expect(flags.isBoulder()).toBe(true)
      expect(flags.getValue()).toBe(5) // 1 + 4
    })

    test('should handle all false as empty', () => {
      const flags = StyleFlags.createFromBooleans(
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
      )

      expect(flags.isEmpty()).toBe(true)
      expect(flags.getValue()).toBe(0)
    })
  })

  describe('getPrimaryStyle', () => {
    test('should return Sport as primary when set', () => {
      const flags = StyleFlags.createFrom(
        ClimbingStyle.SPORT | ClimbingStyle.TRAD,
      )

      expect(flags.getPrimaryStyle()).toBe('Sport')
    })

    test('should return Trad when Sport is not set', () => {
      const flags = StyleFlags.createFrom(
        ClimbingStyle.TRAD | ClimbingStyle.BOULDER,
      )

      expect(flags.getPrimaryStyle()).toBe('Trad')
    })

    test('should return Unknown when no styles set', () => {
      const flags = StyleFlags.empty()

      expect(flags.getPrimaryStyle()).toBe('Unknown')
    })

    test('should return Ice when only ice is set', () => {
      const flags = StyleFlags.createFrom(ClimbingStyle.ICE)

      expect(flags.getPrimaryStyle()).toBe('Ice')
    })
  })

  describe('getActiveStyles', () => {
    test('should return all active styles in order', () => {
      const flags = StyleFlags.createFrom(
        ClimbingStyle.SPORT | ClimbingStyle.BOULDER | ClimbingStyle.ICE,
      )

      expect(flags.getActiveStyles()).toEqual(['Sport', 'Boulder', 'Ice'])
    })

    test('should return empty array when no styles', () => {
      const flags = StyleFlags.empty()

      expect(flags.getActiveStyles()).toEqual([])
    })
  })

  describe('getStyleCount', () => {
    test('should count single style', () => {
      const flags = StyleFlags.createFrom(ClimbingStyle.SPORT)

      expect(flags.getStyleCount()).toBe(1)
    })

    test('should count multiple styles', () => {
      const flags = StyleFlags.createFrom(
        ClimbingStyle.SPORT | ClimbingStyle.TRAD | ClimbingStyle.AID,
      )

      expect(flags.getStyleCount()).toBe(3)
    })

    test('should return zero for empty', () => {
      const flags = StyleFlags.empty()

      expect(flags.getStyleCount()).toBe(0)
    })
  })

  describe('isMultiStyle', () => {
    test('should return false for single style', () => {
      const flags = StyleFlags.createFrom(ClimbingStyle.SPORT)

      expect(flags.isMultiStyle()).toBe(false)
    })

    test('should return true for multiple styles', () => {
      const flags = StyleFlags.createFrom(
        ClimbingStyle.SPORT | ClimbingStyle.TRAD,
      )

      expect(flags.isMultiStyle()).toBe(true)
    })

    test('should return false for empty', () => {
      const flags = StyleFlags.empty()

      expect(flags.isMultiStyle()).toBe(false)
    })
  })

  describe('hasStyle', () => {
    test('should detect specific style', () => {
      const flags = StyleFlags.createFrom(
        ClimbingStyle.ALPINE | ClimbingStyle.MIXED,
      )

      expect(flags.hasStyle(ClimbingStyle.ALPINE)).toBe(true)
      expect(flags.hasStyle(ClimbingStyle.MIXED)).toBe(true)
      expect(flags.hasStyle(ClimbingStyle.SPORT)).toBe(false)
    })
  })

  describe('equals', () => {
    test('should return true for same values', () => {
      const flags1 = StyleFlags.createFrom(7)
      const flags2 = StyleFlags.createFrom(7)

      expect(flags1.equals(flags2)).toBe(true)
    })

    test('should return false for different values', () => {
      const flags1 = StyleFlags.createFrom(7)
      const flags2 = StyleFlags.createFrom(3)

      expect(flags1.equals(flags2)).toBe(false)
    })
  })

  describe('toString', () => {
    test('should return comma-separated styles', () => {
      const flags = StyleFlags.createFrom(
        ClimbingStyle.SPORT | ClimbingStyle.TRAD,
      )

      expect(flags.toString()).toBe('Sport, Trad')
    })

    test('should return "No style" for empty', () => {
      const flags = StyleFlags.empty()

      expect(flags.toString()).toBe('No style')
    })
  })

  describe('ClimbingStyle enum values', () => {
    test('should have correct bit values', () => {
      expect(ClimbingStyle.SPORT).toBe(1)
      expect(ClimbingStyle.TRAD).toBe(2)
      expect(ClimbingStyle.BOULDER).toBe(4)
      expect(ClimbingStyle.AID).toBe(8)
      expect(ClimbingStyle.ALPINE).toBe(16)
      expect(ClimbingStyle.MIXED).toBe(32)
      expect(ClimbingStyle.ICE).toBe(64)
      expect(ClimbingStyle.TOP_ROPE).toBe(128)
    })
  })
})
