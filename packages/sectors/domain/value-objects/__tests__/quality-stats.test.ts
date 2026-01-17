import { describe, expect, test } from 'bun:test'
import { QualityStats } from '../quality-stats.vo'

describe('QualityStats Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create from quality data (simplest)
  // 2. ✓ Get classic routes count (3 stars)
  // 3. ✓ Get recommended routes count (2+ stars)
  // 4. ✓ Get average quality score
  // 5. ✓ Get high quality percentage
  // 6. ✓ Get quality rating (0-3 scale, like route stars)
  // 7. ✓ Create empty stats
  // 8. ✓ Serialize to primitives

  describe('Creation', () => {
    test('should create from quality data', () => {
      // Arrange
      const data = {
        totalRoutes: 100,
        classicRoutesCount: 10,
        recommendedRoutesCount: 30,
        averageQualityScore: 65,
        averageStars: 2.1,
      }

      // Act
      const stats = QualityStats.createFrom(data)

      // Assert
      expect(stats).toBeInstanceOf(QualityStats)
      expect(stats.getTotalRoutes()).toBe(100)
    })

    test('should create empty stats', () => {
      // Act
      const stats = QualityStats.createEmpty()

      // Assert
      expect(stats.getTotalRoutes()).toBe(0)
      expect(stats.isEmpty()).toBe(true)
    })

    test('should handle null or undefined input', () => {
      // Act
      const statsNull = QualityStats.createFrom(null)
      const statsUndefined = QualityStats.createFrom(undefined)

      // Assert
      expect(statsNull.isEmpty()).toBe(true)
      expect(statsUndefined.isEmpty()).toBe(true)
    })
  })

  describe('Classic Routes', () => {
    test('should get classic routes count (3 stars)', () => {
      // Arrange
      const data = {
        totalRoutes: 100,
        classicRoutesCount: 15,
        recommendedRoutesCount: 40,
      }

      // Act
      const stats = QualityStats.createFrom(data)

      // Assert
      expect(stats.getClassicRoutesCount()).toBe(15)
      expect(stats.getClassicRoutesPercentage()).toBe(15)
    })

    test('should detect sector with classics', () => {
      // Arrange
      const data = {
        totalRoutes: 100,
        classicRoutesCount: 5,
      }

      // Act
      const stats = QualityStats.createFrom(data)

      // Assert
      expect(stats.hasClassics()).toBe(true)
    })
  })

  describe('Recommended Routes', () => {
    test('should get recommended routes count (2+ stars)', () => {
      // Arrange
      const data = {
        totalRoutes: 50,
        classicRoutesCount: 10,
        recommendedRoutesCount: 25,
      }

      // Act
      const stats = QualityStats.createFrom(data)

      // Assert
      expect(stats.getRecommendedRoutesCount()).toBe(25)
      expect(stats.getRecommendedRoutesPercentage()).toBe(50)
    })
  })

  describe('Quality Score', () => {
    test('should get average quality score', () => {
      // Arrange
      const data = {
        totalRoutes: 100,
        averageQualityScore: 72.5,
      }

      // Act
      const stats = QualityStats.createFrom(data)

      // Assert
      expect(stats.getAverageQualityScore()).toBe(72.5)
    })

    test('should get high quality percentage', () => {
      // Arrange
      const data = {
        totalRoutes: 100,
        highQualityRoutesCount: 35,
      }

      // Act
      const stats = QualityStats.createFrom(data)

      // Assert
      expect(stats.getHighQualityPercentage()).toBe(35)
    })

    test('should detect high quality sector', () => {
      // Arrange - More than 50% high quality routes
      const data = {
        totalRoutes: 100,
        highQualityRoutesCount: 55,
        averageQualityScore: 75,
      }

      // Act
      const stats = QualityStats.createFrom(data)

      // Assert
      expect(stats.isHighQualitySector()).toBe(true)
    })
  })

  describe('Quality Rating', () => {
    test('should calculate quality rating (0-3 scale, like route stars)', () => {
      // Arrange - High quality sector
      const data = {
        totalRoutes: 100,
        classicRoutesCount: 20,
        recommendedRoutesCount: 60,
        averageQualityScore: 80,
        averageStars: 2.5,
      }

      // Act
      const stats = QualityStats.createFrom(data)
      const rating = stats.getQualityRating()

      // Assert - Now on 0-3 scale
      expect(rating).toBeGreaterThanOrEqual(0)
      expect(rating).toBeLessThanOrEqual(3)
      expect(rating).toBeGreaterThan(1.5) // Should be above middle on 0-3 scale
    })

    test('should return low rating for poor quality', () => {
      // Arrange
      const data = {
        totalRoutes: 100,
        classicRoutesCount: 0,
        recommendedRoutesCount: 5,
        averageQualityScore: 30,
        averageStars: 0.5,
      }

      // Act
      const stats = QualityStats.createFrom(data)
      const rating = stats.getQualityRating()

      // Assert - Should be below middle on 0-3 scale
      expect(rating).toBeLessThan(1.5)
    })
  })

  describe('Serialization', () => {
    test('should convert to primitives', () => {
      // Arrange
      const data = {
        totalRoutes: 100,
        classicRoutesCount: 10,
        recommendedRoutesCount: 30,
        highQualityRoutesCount: 40,
        averageQualityScore: 65,
        averageStars: 2.0,
      }

      // Act
      const stats = QualityStats.createFrom(data)
      const primitives = stats.toPrimitives()

      // Assert
      expect(primitives).toHaveProperty('totalRoutes')
      expect(primitives).toHaveProperty('classicRoutesCount')
      expect(primitives).toHaveProperty('recommendedRoutesCount')
      expect(primitives).toHaveProperty('highQualityRoutesCount')
      expect(primitives).toHaveProperty('averageQualityScore')
      expect(primitives).toHaveProperty('qualityRating')
      expect(primitives).toHaveProperty('isHighQualitySector')
    })
  })

  describe('Equality', () => {
    test('should compare two stats for equality', () => {
      // Arrange
      const data = {
        totalRoutes: 100,
        classicRoutesCount: 10,
      }
      const stats1 = QualityStats.createFrom(data)
      const stats2 = QualityStats.createFrom(data)

      // Assert
      expect(stats1.equals(stats2)).toBe(true)
    })
  })
})
