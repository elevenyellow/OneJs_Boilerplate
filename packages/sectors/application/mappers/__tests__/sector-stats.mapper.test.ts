import { describe, expect, test } from 'bun:test'
import {
  SectorStatsMapper,
  type RouteDataForStats,
} from '../sector-stats.mapper'
import { ClimbingStyle } from '@routes/domain/value-objects'

describe('SectorStatsMapper', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Calculate stats from empty routes array
  // 2. ✓ Calculate stats from routes with full data
  // 3. ✓ Calculate stats from grade bands only
  // 4. ✓ Calculate correct grade ranges in French system
  // 5. ✓ Calculate correct grade ranges in YDS system
  // 6. ✓ Calculate style distribution correctly
  // 7. ✓ Calculate audience profile correctly

  const createMockRoute = (
    overrides: Partial<RouteDataForStats> = {},
  ): RouteDataForStats => ({
    gradeBand: 25,
    stars: 2,
    ascents: 50,
    popularity: 0.5,
    height: 20,
    pitches: 1,
    bolts: 8,
    hasTopo: true,
    styleFlags: ClimbingStyle.SPORT, // Default to sport
    name: 'Test Route',
    ...overrides,
  })

  describe('Calculate From Routes', () => {
    test('should return minimal stats for empty routes array', () => {
      // Arrange
      const routes: RouteDataForStats[] = []

      // Act
      const result = SectorStatsMapper.calculateFromRoutes(routes)

      // Assert - Empty array should have null/0 values for route counts
      expect(result.sportCount).toBe(0)
      expect(result.tradCount).toBe(0)
      expect(result.totalAscents).toBe(0)
      expect(result.minGradeIndex).toBeNull()
      expect(result.maxGradeIndex).toBeNull()
    })

    test('should calculate stats from routes with full data', () => {
      // Arrange
      const routes = [
        createMockRoute({
          gradeBand: 25,
          stars: 3,
          ascents: 100,
          height: 25,
          pitches: 1,
          bolts: 10,
          hasTopo: true,
          styleFlags: ClimbingStyle.SPORT,
        }),
        createMockRoute({
          gradeBand: 30,
          stars: 2,
          ascents: 60,
          height: 30,
          pitches: 1,
          bolts: 12,
          hasTopo: true,
          styleFlags: ClimbingStyle.SPORT,
        }),
      ]

      // Act
      const result = SectorStatsMapper.calculateFromRoutes(routes)

      // Assert
      expect(result.sportCount).toBe(2)
      expect(result.primaryStyle).toBe('sport')
      expect(result.classicRoutesCount).toBe(1)
      expect(result.totalAscents).toBe(160)
      expect(result.overallScore).toBeGreaterThan(0)
      // sectorRating is now on 0-3 scale (like route stars)
      expect(result.sectorRating).toBeGreaterThanOrEqual(0)
      expect(result.sectorRating).toBeLessThanOrEqual(3)
    })

    test('should calculate style distribution correctly', () => {
      // Arrange
      const routes = [
        createMockRoute({ styleFlags: ClimbingStyle.SPORT, gradeBand: 25 }),
        createMockRoute({ styleFlags: ClimbingStyle.SPORT, gradeBand: 26 }),
        createMockRoute({ styleFlags: ClimbingStyle.TRAD, gradeBand: 27 }),
        createMockRoute({ styleFlags: ClimbingStyle.BOULDER, gradeBand: 20 }),
      ]

      // Act
      const result = SectorStatsMapper.calculateFromRoutes(routes)

      // Assert
      expect(result.sportCount).toBe(2)
      expect(result.tradCount).toBe(1)
      expect(result.boulderCount).toBe(1)
      expect(result.primaryStyle).toBe('sport')
    })

    test('should calculate audience profile correctly', () => {
      // Arrange - Mostly beginner routes
      const routes = [
        createMockRoute({ gradeBand: 15 }), // Beginner
        createMockRoute({ gradeBand: 18 }), // Beginner
        createMockRoute({ gradeBand: 20 }), // Beginner
        createMockRoute({ gradeBand: 22 }), // Beginner
        createMockRoute({ gradeBand: 28 }), // Intermediate
      ]

      // Act
      const result = SectorStatsMapper.calculateFromRoutes(routes)

      // Assert
      expect(result.beginnerRoutesCount).toBe(4)
      expect(result.intermediateRoutesCount).toBe(1)
      expect(result.isBeginnerFriendly).toBe(true)
      expect(result.primaryAudience).toBe('beginner')
    })
  })

  describe('Calculate From Grade Bands', () => {
    test('should calculate stats from grade bands', () => {
      // Arrange - Array where index = grade band, value = route count
      const gbRoutes = new Array(53).fill(0)
      gbRoutes[20] = 5 // 5 routes at grade band 20
      gbRoutes[25] = 10 // 10 routes at grade band 25
      gbRoutes[30] = 3 // 3 routes at grade band 30

      // Act
      const result = SectorStatsMapper.calculateFromGradeBands(gbRoutes, null)

      // Assert
      expect(result.minGradeIndex).toBe(20)
      expect(result.maxGradeIndex).toBe(30)
      expect(result.modeGradeIndex).toBe(25) // Most common
    })

    test('should calculate beginner friendly status correctly', () => {
      // Arrange - Mostly beginner routes
      const gbRoutes = new Array(53).fill(0)
      gbRoutes[15] = 10 // Many beginner routes
      gbRoutes[18] = 8
      gbRoutes[20] = 5
      gbRoutes[30] = 2 // Few intermediate

      // Act
      const result = SectorStatsMapper.calculateFromGradeBands(gbRoutes, null)

      // Assert
      expect(result.isBeginnerFriendly).toBe(true)
      expect(result.beginnerPercentage).toBeGreaterThan(50)
    })

    test('should handle null input', () => {
      // Act
      const result = SectorStatsMapper.calculateFromGradeBands(null, null)

      // Assert
      expect(result.minGradeIndex).toBeNull()
      expect(result.maxGradeIndex).toBeNull()
    })
  })
})
