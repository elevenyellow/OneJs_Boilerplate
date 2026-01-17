import { describe, expect, test } from 'bun:test'
import { GradeDistributionStats } from '../grade-distribution-stats.vo'

describe('GradeDistributionStats Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create from grade bands array (simplest)
  // 2. ✓ Get total routes count
  // 3. ✓ Get grade range in French system
  // 4. ✓ Get grade range in YDS system
  // 5. ✓ Get most common grade (mode)
  // 6. ✓ Get median grade
  // 7. ✓ Get difficulty spread (concentrated vs varied)
  // 8. ✓ Get percentile distribution
  // 9. ✓ Get beginner routes count (grades ≤ 5c / 5.9)
  // 10. ✓ Get intermediate routes count (6a-7a / 5.10-5.11)
  // 11. ✓ Get advanced routes count (7a+-8a / 5.12-5.13)
  // 12. ✓ Get elite routes count (8a+ / 5.14+)
  // 13. ✓ Create empty stats
  // 14. ✓ Get histogram data for charts
  // 15. ✓ Calculate difficulty concentration score

  describe('Creation', () => {
    test('should create from grade bands array', () => {
      // Arrange - Array where index = universal grade index, value = route count
      // Index 10 = 3a/5.0, Index 20 = 5a/5.6, Index 30 = 6b/5.10c, etc.
      const gbRoutes = new Array(53).fill(0)
      gbRoutes[20] = 5 // 5a - 5 routes
      gbRoutes[25] = 10 // 5c+ - 10 routes
      gbRoutes[30] = 8 // 6b - 8 routes

      // Act
      const stats = GradeDistributionStats.createFrom(gbRoutes)

      // Assert
      expect(stats).toBeInstanceOf(GradeDistributionStats)
      expect(stats.getTotalRoutes()).toBe(23)
    })

    test('should create empty stats when no routes', () => {
      // Act
      const stats = GradeDistributionStats.createEmpty()

      // Assert
      expect(stats.getTotalRoutes()).toBe(0)
      expect(stats.isEmpty()).toBe(true)
    })

    test('should handle null or undefined input', () => {
      // Act
      const statsNull = GradeDistributionStats.createFrom(null)
      const statsUndefined = GradeDistributionStats.createFrom(undefined)

      // Assert
      expect(statsNull.isEmpty()).toBe(true)
      expect(statsUndefined.isEmpty()).toBe(true)
    })
  })

  describe('Grade Range', () => {
    test('should get grade range in French system', () => {
      // Arrange
      const gbRoutes = new Array(53).fill(0)
      gbRoutes[20] = 5 // Index 20
      gbRoutes[35] = 3 // Index 35

      // Act
      const stats = GradeDistributionStats.createFrom(gbRoutes)
      const range = stats.getGradeRange('french')

      // Assert
      expect(range).not.toBeNull()
      expect(range).toContain(' - ')
      // Verify it contains valid French grades
      expect(range?.split(' - ')).toHaveLength(2)
    })

    test('should get grade range in YDS system', () => {
      // Arrange
      const gbRoutes = new Array(53).fill(0)
      gbRoutes[20] = 5 // 5.6
      gbRoutes[35] = 3 // 5.12a

      // Act
      const stats = GradeDistributionStats.createFrom(gbRoutes)
      const range = stats.getGradeRange('yds')

      // Assert
      expect(range).not.toBeNull()
      expect(range).toContain('5.')
    })

    test('should return null range for empty stats', () => {
      // Act
      const stats = GradeDistributionStats.createEmpty()

      // Assert
      expect(stats.getGradeRange('french')).toBeNull()
    })

    test('should return single grade when min equals max', () => {
      // Arrange
      const gbRoutes = new Array(53).fill(0)
      gbRoutes[25] = 10 // Only 5c+ routes

      // Act
      const stats = GradeDistributionStats.createFrom(gbRoutes)
      const range = stats.getGradeRange('french')

      // Assert
      expect(range).not.toContain(' - ')
    })
  })

  describe('Statistical Analysis', () => {
    test('should get most common grade (mode)', () => {
      // Arrange
      const gbRoutes = new Array(53).fill(0)
      gbRoutes[20] = 5 // 5a - 5 routes
      gbRoutes[25] = 15 // 5c+ - 15 routes (mode)
      gbRoutes[30] = 8 // 6b - 8 routes

      // Act
      const stats = GradeDistributionStats.createFrom(gbRoutes)
      const mode = stats.getMostCommonGradeIndex()

      // Assert
      expect(mode).toBe(25)
    })

    test('should get median grade index', () => {
      // Arrange
      const gbRoutes = new Array(53).fill(0)
      gbRoutes[20] = 5 // 5 routes
      gbRoutes[25] = 10 // 10 routes
      gbRoutes[30] = 5 // 5 routes
      // Total 20 routes, median at position 10, which falls in index 25

      // Act
      const stats = GradeDistributionStats.createFrom(gbRoutes)
      const median = stats.getMedianGradeIndex()

      // Assert
      expect(median).toBe(25)
    })

    test('should calculate difficulty spread as concentrated', () => {
      // Arrange - Routes concentrated in 2 adjacent grades
      const gbRoutes = new Array(53).fill(0)
      gbRoutes[25] = 20
      gbRoutes[26] = 18

      // Act
      const stats = GradeDistributionStats.createFrom(gbRoutes)
      const spread = stats.getDifficultySpread()

      // Assert
      expect(spread).toBe('concentrated')
    })

    test('should calculate difficulty spread as varied', () => {
      // Arrange - Routes spread across many grades with more even distribution
      const gbRoutes = new Array(53).fill(0)
      // Spread routes more evenly across many grades
      for (let i = 10; i <= 45; i += 2) {
        gbRoutes[i] = 3
      }

      // Act
      const stats = GradeDistributionStats.createFrom(gbRoutes)
      const spread = stats.getDifficultySpread()

      // Assert
      expect(spread).toBe('varied')
    })
  })

  describe('Difficulty Level Counts', () => {
    test('should count beginner routes (indices 10-22, up to ~5c/5.9)', () => {
      // Arrange
      const gbRoutes = new Array(53).fill(0)
      gbRoutes[15] = 10 // Beginner
      gbRoutes[20] = 8 // Beginner
      gbRoutes[30] = 5 // Not beginner

      // Act
      const stats = GradeDistributionStats.createFrom(gbRoutes)

      // Assert
      expect(stats.getBeginnerRoutesCount()).toBe(18)
    })

    test('should count intermediate routes (indices 23-34, ~6a-6c+/5.10-5.11)', () => {
      // Arrange
      const gbRoutes = new Array(53).fill(0)
      gbRoutes[25] = 10 // Intermediate
      gbRoutes[30] = 12 // Intermediate
      gbRoutes[40] = 5 // Not intermediate

      // Act
      const stats = GradeDistributionStats.createFrom(gbRoutes)

      // Assert
      expect(stats.getIntermediateRoutesCount()).toBe(22)
    })

    test('should count advanced routes (indices 35-44, ~7a-7c+/5.12-5.13)', () => {
      // Arrange
      const gbRoutes = new Array(53).fill(0)
      gbRoutes[35] = 8 // Advanced
      gbRoutes[40] = 6 // Advanced
      gbRoutes[50] = 2 // Elite, not advanced

      // Act
      const stats = GradeDistributionStats.createFrom(gbRoutes)

      // Assert
      expect(stats.getAdvancedRoutesCount()).toBe(14)
    })

    test('should count elite routes (indices 45+, ~8a+/5.14+)', () => {
      // Arrange
      const gbRoutes = new Array(53).fill(0)
      gbRoutes[45] = 3 // Elite
      gbRoutes[48] = 2 // Elite
      gbRoutes[52] = 1 // Elite

      // Act
      const stats = GradeDistributionStats.createFrom(gbRoutes)

      // Assert
      expect(stats.getEliteRoutesCount()).toBe(6)
    })

    test('should get difficulty level percentages', () => {
      // Arrange
      const gbRoutes = new Array(53).fill(0)
      gbRoutes[15] = 25 // Beginner (25%)
      gbRoutes[30] = 50 // Intermediate (50%)
      gbRoutes[40] = 20 // Advanced (20%)
      gbRoutes[50] = 5 // Elite (5%)

      // Act
      const stats = GradeDistributionStats.createFrom(gbRoutes)
      const percentages = stats.getDifficultyLevelPercentages()

      // Assert
      expect(percentages.beginner).toBe(25)
      expect(percentages.intermediate).toBe(50)
      expect(percentages.advanced).toBe(20)
      expect(percentages.elite).toBe(5)
    })
  })

  describe('Histogram and Visualization', () => {
    test('should get histogram data for charts', () => {
      // Arrange
      const gbRoutes = new Array(53).fill(0)
      gbRoutes[20] = 5
      gbRoutes[25] = 10
      gbRoutes[30] = 8

      // Act
      const stats = GradeDistributionStats.createFrom(gbRoutes)
      const histogram = stats.getHistogramData()

      // Assert
      expect(histogram).toBeInstanceOf(Array)
      expect(histogram.length).toBeGreaterThan(0)
      expect(histogram[0]).toHaveProperty('gradeIndex')
      expect(histogram[0]).toHaveProperty('count')
      expect(histogram[0]).toHaveProperty('percentage')
    })

    test('should calculate concentration score (0-100)', () => {
      // Arrange - Highly concentrated distribution
      const gbRoutes = new Array(53).fill(0)
      gbRoutes[25] = 50 // All routes at one grade

      // Act
      const stats = GradeDistributionStats.createFrom(gbRoutes)
      const score = stats.getConcentrationScore()

      // Assert
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
      expect(score).toBeGreaterThan(80) // High concentration
    })
  })

  describe('Serialization', () => {
    test('should convert to primitives', () => {
      // Arrange
      const gbRoutes = new Array(53).fill(0)
      gbRoutes[20] = 5
      gbRoutes[30] = 10

      // Act
      const stats = GradeDistributionStats.createFrom(gbRoutes)
      const primitives = stats.toPrimitives()

      // Assert
      expect(primitives).toHaveProperty('totalRoutes')
      expect(primitives).toHaveProperty('gradeRangeFrench')
      expect(primitives).toHaveProperty('beginnerCount')
      expect(primitives).toHaveProperty('intermediateCount')
      expect(primitives).toHaveProperty('advancedCount')
      expect(primitives).toHaveProperty('eliteCount')
      expect(primitives).toHaveProperty('difficultySpread')
      expect(primitives).toHaveProperty('concentrationScore')
    })
  })

  describe('Equality', () => {
    test('should compare two stats for equality', () => {
      // Arrange
      const gbRoutes1 = new Array(53).fill(0)
      gbRoutes1[20] = 5
      const gbRoutes2 = new Array(53).fill(0)
      gbRoutes2[20] = 5

      // Act
      const stats1 = GradeDistributionStats.createFrom(gbRoutes1)
      const stats2 = GradeDistributionStats.createFrom(gbRoutes2)

      // Assert
      expect(stats1.equals(stats2)).toBe(true)
    })
  })
})
