import { describe, expect, test } from 'bun:test'
import { PopularityStats } from '../popularity-stats.vo'

describe('PopularityStats Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create from popularity data (simplest)
  // 2. ✓ Get total ascents
  // 3. ✓ Get popular routes count (50+ ascents)
  // 4. ✓ Get very popular routes count (100+ ascents)
  // 5. ✓ Get average ascents per route
  // 6. ✓ Get most climbed route info
  // 7. ✓ Get popularity score (0-3, like route stars)
  // 8. ✓ Create empty stats
  // 9. ✓ Serialize to primitives

  describe('Creation', () => {
    test('should create from popularity data', () => {
      // Arrange
      const data = {
        totalRoutes: 100,
        totalAscents: 5000,
        popularRoutesCount: 25,
        veryPopularRoutesCount: 10,
        averageAscentsPerRoute: 50,
        mostClimbedRoute: { name: 'La Rambla', ascents: 500 },
      }

      // Act
      const stats = PopularityStats.createFrom(data)

      // Assert
      expect(stats).toBeInstanceOf(PopularityStats)
      expect(stats.getTotalRoutes()).toBe(100)
    })

    test('should create empty stats', () => {
      // Act
      const stats = PopularityStats.createEmpty()

      // Assert
      expect(stats.getTotalRoutes()).toBe(0)
      expect(stats.isEmpty()).toBe(true)
    })
  })

  describe('Ascent Metrics', () => {
    test('should get total ascents', () => {
      // Arrange
      const data = {
        totalRoutes: 50,
        totalAscents: 2500,
      }

      // Act
      const stats = PopularityStats.createFrom(data)

      // Assert
      expect(stats.getTotalAscents()).toBe(2500)
    })

    test('should get average ascents per route', () => {
      // Arrange
      const data = {
        totalRoutes: 50,
        totalAscents: 2500,
        averageAscentsPerRoute: 50,
      }

      // Act
      const stats = PopularityStats.createFrom(data)

      // Assert
      expect(stats.getAverageAscentsPerRoute()).toBe(50)
    })
  })

  describe('Popular Routes', () => {
    test('should get popular routes count (50+ ascents)', () => {
      // Arrange
      const data = {
        totalRoutes: 100,
        popularRoutesCount: 30,
      }

      // Act
      const stats = PopularityStats.createFrom(data)

      // Assert
      expect(stats.getPopularRoutesCount()).toBe(30)
      expect(stats.getPopularRoutesPercentage()).toBe(30)
    })

    test('should get very popular routes count (100+ ascents)', () => {
      // Arrange
      const data = {
        totalRoutes: 100,
        veryPopularRoutesCount: 15,
      }

      // Act
      const stats = PopularityStats.createFrom(data)

      // Assert
      expect(stats.getVeryPopularRoutesCount()).toBe(15)
      expect(stats.getVeryPopularRoutesPercentage()).toBe(15)
    })
  })

  describe('Most Climbed Route', () => {
    test('should get most climbed route info', () => {
      // Arrange
      const data = {
        totalRoutes: 50,
        mostClimbedRoute: { name: 'La Rambla', ascents: 500 },
      }

      // Act
      const stats = PopularityStats.createFrom(data)
      const mostClimbed = stats.getMostClimbedRoute()

      // Assert
      expect(mostClimbed).not.toBeNull()
      expect(mostClimbed?.name).toBe('La Rambla')
      expect(mostClimbed?.ascents).toBe(500)
    })

    test('should return null when no most climbed route', () => {
      // Arrange
      const data = {
        totalRoutes: 50,
      }

      // Act
      const stats = PopularityStats.createFrom(data)

      // Assert
      expect(stats.getMostClimbedRoute()).toBeNull()
    })
  })

  describe('Popularity Score', () => {
    test('should calculate popularity score (0-3)', () => {
      // Arrange
      const data = {
        totalRoutes: 100,
        totalAscents: 10000,
        popularRoutesCount: 50,
        veryPopularRoutesCount: 20,
        averageAscentsPerRoute: 100,
      }

      // Act
      const stats = PopularityStats.createFrom(data)
      const score = stats.getPopularityScore()

      // Assert - now on 0-3 scale like route stars
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(3)
    })

    test('should detect popular sector', () => {
      // Arrange
      const data = {
        totalRoutes: 100,
        popularRoutesCount: 40,
        averageAscentsPerRoute: 80,
      }

      // Act
      const stats = PopularityStats.createFrom(data)

      // Assert
      expect(stats.isPopularSector()).toBe(true)
    })
  })

  describe('Serialization', () => {
    test('should convert to primitives', () => {
      // Arrange
      const data = {
        totalRoutes: 100,
        totalAscents: 5000,
        popularRoutesCount: 25,
        veryPopularRoutesCount: 10,
        averageAscentsPerRoute: 50,
      }

      // Act
      const stats = PopularityStats.createFrom(data)
      const primitives = stats.toPrimitives()

      // Assert
      expect(primitives).toHaveProperty('totalRoutes')
      expect(primitives).toHaveProperty('totalAscents')
      expect(primitives).toHaveProperty('popularRoutesCount')
      expect(primitives).toHaveProperty('veryPopularRoutesCount')
      expect(primitives).toHaveProperty('averageAscentsPerRoute')
      expect(primitives).toHaveProperty('popularityScore')
      expect(primitives).toHaveProperty('isPopularSector')
    })
  })
})
