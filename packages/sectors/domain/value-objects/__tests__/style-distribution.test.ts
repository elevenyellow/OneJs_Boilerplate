import { describe, expect, test } from 'bun:test'
import { StyleDistribution } from '../style-distribution.vo'

describe('StyleDistribution Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create from route style counts (simplest)
  // 2. ✓ Get total routes count
  // 3. ✓ Get sport routes count and percentage
  // 4. ✓ Get trad routes count and percentage
  // 5. ✓ Get boulder routes count and percentage
  // 6. ✓ Get other style counts (aid, alpine, mixed, ice, topRope)
  // 7. ✓ Get primary/dominant style
  // 8. ✓ Get all styles with counts
  // 9. ✓ Check if sector is multi-style
  // 10. ✓ Create empty stats
  // 11. ✓ Serialize to primitives

  describe('Creation', () => {
    test('should create from route style counts', () => {
      // Arrange
      const styleCounts = {
        sport: 50,
        trad: 20,
        boulder: 10,
        aid: 0,
        alpine: 5,
        mixed: 0,
        ice: 0,
        topRope: 15,
      }

      // Act
      const stats = StyleDistribution.createFrom(styleCounts)

      // Assert
      expect(stats).toBeInstanceOf(StyleDistribution)
      expect(stats.getTotalRoutes()).toBe(100)
    })

    test('should create empty stats', () => {
      // Act
      const stats = StyleDistribution.createEmpty()

      // Assert
      expect(stats.getTotalRoutes()).toBe(0)
      expect(stats.isEmpty()).toBe(true)
    })

    test('should handle null or undefined input', () => {
      // Act
      const statsNull = StyleDistribution.createFrom(null)
      const statsUndefined = StyleDistribution.createFrom(undefined)

      // Assert
      expect(statsNull.isEmpty()).toBe(true)
      expect(statsUndefined.isEmpty()).toBe(true)
    })
  })

  describe('Style Counts', () => {
    test('should get sport routes count and percentage', () => {
      // Arrange
      const styleCounts = { sport: 60, trad: 40 }

      // Act
      const stats = StyleDistribution.createFrom(styleCounts)

      // Assert
      expect(stats.getSportCount()).toBe(60)
      expect(stats.getSportPercentage()).toBe(60)
    })

    test('should get trad routes count and percentage', () => {
      // Arrange
      const styleCounts = { sport: 30, trad: 70 }

      // Act
      const stats = StyleDistribution.createFrom(styleCounts)

      // Assert
      expect(stats.getTradCount()).toBe(70)
      expect(stats.getTradPercentage()).toBe(70)
    })

    test('should get boulder routes count and percentage', () => {
      // Arrange
      const styleCounts = { boulder: 100 }

      // Act
      const stats = StyleDistribution.createFrom(styleCounts)

      // Assert
      expect(stats.getBoulderCount()).toBe(100)
      expect(stats.getBoulderPercentage()).toBe(100)
    })

    test('should get other style counts', () => {
      // Arrange
      const styleCounts = {
        sport: 10,
        aid: 15,
        alpine: 20,
        mixed: 5,
        ice: 10,
        topRope: 40,
      }

      // Act
      const stats = StyleDistribution.createFrom(styleCounts)

      // Assert
      expect(stats.getAidCount()).toBe(15)
      expect(stats.getAlpineCount()).toBe(20)
      expect(stats.getMixedCount()).toBe(5)
      expect(stats.getIceCount()).toBe(10)
      expect(stats.getTopRopeCount()).toBe(40)
    })
  })

  describe('Primary Style Analysis', () => {
    test('should get primary/dominant style', () => {
      // Arrange
      const styleCounts = {
        sport: 100,
        trad: 30,
        boulder: 20,
      }

      // Act
      const stats = StyleDistribution.createFrom(styleCounts)

      // Assert
      expect(stats.getPrimaryStyle()).toBe('sport')
    })

    test('should return unknown for empty distribution', () => {
      // Act
      const stats = StyleDistribution.createEmpty()

      // Assert
      expect(stats.getPrimaryStyle()).toBe('unknown')
    })

    test('should handle tie by returning first in priority', () => {
      // Arrange - sport and trad tied, sport has priority
      const styleCounts = {
        sport: 50,
        trad: 50,
      }

      // Act
      const stats = StyleDistribution.createFrom(styleCounts)
      const primary = stats.getPrimaryStyle()

      // Assert - sport has priority in ties
      expect(primary).toBe('sport')
    })
  })

  describe('Multi-Style Detection', () => {
    test('should detect multi-style sector', () => {
      // Arrange - 3 styles with significant presence (>10%)
      const styleCounts = {
        sport: 40,
        trad: 35,
        boulder: 25,
      }

      // Act
      const stats = StyleDistribution.createFrom(styleCounts)

      // Assert
      expect(stats.isMultiStyle()).toBe(true)
      expect(stats.getStyleCount()).toBe(3)
    })

    test('should detect single-style sector', () => {
      // Arrange - Only sport routes
      const styleCounts = {
        sport: 100,
        trad: 0,
        boulder: 0,
      }

      // Act
      const stats = StyleDistribution.createFrom(styleCounts)

      // Assert
      expect(stats.isMultiStyle()).toBe(false)
      expect(stats.getStyleCount()).toBe(1)
    })

    test('should detect predominantly one style with minor others', () => {
      // Arrange - Sport dominant, others < 10%
      const styleCounts = {
        sport: 90,
        trad: 5,
        boulder: 5,
      }

      // Act
      const stats = StyleDistribution.createFrom(styleCounts)

      // Assert
      expect(stats.isPredominantlySingleStyle()).toBe(true)
    })
  })

  describe('All Styles Data', () => {
    test('should get all styles with counts', () => {
      // Arrange
      const styleCounts = {
        sport: 50,
        trad: 30,
        boulder: 20,
      }

      // Act
      const stats = StyleDistribution.createFrom(styleCounts)
      const allStyles = stats.getAllStyles()

      // Assert
      expect(allStyles).toBeInstanceOf(Array)
      expect(allStyles.length).toBeGreaterThan(0)
      expect(allStyles[0]).toHaveProperty('style')
      expect(allStyles[0]).toHaveProperty('count')
      expect(allStyles[0]).toHaveProperty('percentage')
    })

    test('should get styles sorted by count descending', () => {
      // Arrange
      const styleCounts = {
        sport: 20,
        trad: 50,
        boulder: 30,
      }

      // Act
      const stats = StyleDistribution.createFrom(styleCounts)
      const allStyles = stats.getAllStyles()

      // Assert
      expect(allStyles[0].style).toBe('trad')
      expect(allStyles[1].style).toBe('boulder')
      expect(allStyles[2].style).toBe('sport')
    })
  })

  describe('Serialization', () => {
    test('should convert to primitives', () => {
      // Arrange
      const styleCounts = {
        sport: 50,
        trad: 30,
        boulder: 20,
      }

      // Act
      const stats = StyleDistribution.createFrom(styleCounts)
      const primitives = stats.toPrimitives()

      // Assert
      expect(primitives).toHaveProperty('totalRoutes')
      expect(primitives).toHaveProperty('sportCount')
      expect(primitives).toHaveProperty('tradCount')
      expect(primitives).toHaveProperty('boulderCount')
      expect(primitives).toHaveProperty('primaryStyle')
      expect(primitives).toHaveProperty('isMultiStyle')
      expect(primitives).toHaveProperty('styleCount')
    })
  })

  describe('Equality', () => {
    test('should compare two distributions for equality', () => {
      // Arrange
      const stats1 = StyleDistribution.createFrom({ sport: 50, trad: 50 })
      const stats2 = StyleDistribution.createFrom({ sport: 50, trad: 50 })

      // Assert
      expect(stats1.equals(stats2)).toBe(true)
    })

    test('should detect inequality', () => {
      // Arrange
      const stats1 = StyleDistribution.createFrom({ sport: 50 })
      const stats2 = StyleDistribution.createFrom({ sport: 60 })

      // Assert
      expect(stats1.equals(stats2)).toBe(false)
    })
  })
})
