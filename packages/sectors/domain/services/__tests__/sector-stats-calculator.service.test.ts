import { describe, expect, test } from 'bun:test'
import { SectorStatsCalculatorService } from '../sector-stats-calculator.service'
import type { RouteStatsData } from '../sector-stats-calculator.service'

describe('SectorStatsCalculatorService', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Calculate stats from empty routes array (simplest)
  // 2. ✓ Calculate grade distribution from routes
  // 3. ✓ Calculate style distribution from routes
  // 4. ✓ Calculate quality stats from routes
  // 5. ✓ Calculate popularity stats from routes
  // 6. ✓ Calculate height stats from routes
  // 7. ✓ Calculate equipment stats from routes
  // 8. ✓ Calculate audience profile from routes
  // 9. ✓ Calculate comprehensive stats

  const createMockRoute = (
    overrides: Partial<RouteStatsData> = {},
  ): RouteStatsData => ({
    gradeBand: 25,
    stars: 2,
    ascents: 50,
    popularity: 0.5,
    height: 20,
    pitches: 1,
    bolts: 8,
    hasTopo: true,
    isSport: true,
    isTrad: false,
    isBoulder: false,
    isAid: false,
    isAlpine: false,
    isMixed: false,
    isIce: false,
    isTopRope: false,
    ...overrides,
  })

  describe('Empty Data', () => {
    test('should calculate stats from empty routes array', () => {
      // Arrange
      const routes: RouteStatsData[] = []

      // Act
      const stats = SectorStatsCalculatorService.calculateFromRoutes(routes)

      // Assert
      expect(stats).not.toBeNull()
      expect(stats.isEmpty()).toBe(true)
    })
  })

  describe('Grade Distribution', () => {
    test('should calculate grade distribution from routes', () => {
      // Arrange
      const routes = [
        createMockRoute({ gradeBand: 20 }), // Beginner
        createMockRoute({ gradeBand: 20 }),
        createMockRoute({ gradeBand: 25 }), // Intermediate
        createMockRoute({ gradeBand: 30 }),
        createMockRoute({ gradeBand: 40 }), // Advanced
      ]

      // Act
      const stats = SectorStatsCalculatorService.calculateFromRoutes(routes)
      const gradeStats = stats.getGradeDistribution()

      // Assert
      expect(gradeStats.getTotalRoutes()).toBe(5)
      expect(gradeStats.getBeginnerRoutesCount()).toBeGreaterThan(0)
    })
  })

  describe('Style Distribution', () => {
    test('should calculate style distribution from routes', () => {
      // Arrange
      const routes = [
        createMockRoute({ isSport: true, isTrad: false }),
        createMockRoute({ isSport: true, isTrad: false }),
        createMockRoute({ isSport: false, isTrad: true }),
        createMockRoute({ isBoulder: true, isSport: false }),
      ]

      // Act
      const stats = SectorStatsCalculatorService.calculateFromRoutes(routes)
      const styleStats = stats.getStyleDistribution()

      // Assert
      expect(styleStats.getTotalRoutes()).toBe(4)
      expect(styleStats.getSportCount()).toBe(2)
      expect(styleStats.getTradCount()).toBe(1)
      expect(styleStats.getBoulderCount()).toBe(1)
      expect(styleStats.getPrimaryStyle()).toBe('sport')
    })
  })

  describe('Quality Stats', () => {
    test('should calculate quality stats from routes', () => {
      // Arrange
      const routes = [
        createMockRoute({ stars: 3 }), // Classic
        createMockRoute({ stars: 2 }), // Recommended
        createMockRoute({ stars: 2 }), // Recommended
        createMockRoute({ stars: 1 }),
        createMockRoute({ stars: 0 }),
      ]

      // Act
      const stats = SectorStatsCalculatorService.calculateFromRoutes(routes)
      const qualityStats = stats.getQuality()

      // Assert
      expect(qualityStats.getTotalRoutes()).toBe(5)
      expect(qualityStats.getClassicRoutesCount()).toBe(1) // 3 stars
      expect(qualityStats.getRecommendedRoutesCount()).toBe(3) // 2+ stars
    })
  })

  describe('Popularity Stats', () => {
    test('should calculate popularity stats from routes', () => {
      // Arrange
      const routes = [
        createMockRoute({ ascents: 150 }), // Very popular
        createMockRoute({ ascents: 75 }), // Popular
        createMockRoute({ ascents: 25 }),
        createMockRoute({ ascents: 10 }),
      ]

      // Act
      const stats = SectorStatsCalculatorService.calculateFromRoutes(routes)
      const popularityStats = stats.getPopularity()

      // Assert
      expect(popularityStats.getTotalRoutes()).toBe(4)
      expect(popularityStats.getTotalAscents()).toBe(260)
      expect(popularityStats.getPopularRoutesCount()).toBe(2) // 50+ ascents
      expect(popularityStats.getVeryPopularRoutesCount()).toBe(1) // 100+ ascents
    })
  })

  describe('Height Stats', () => {
    test('should calculate height stats from routes', () => {
      // Arrange
      const routes = [
        createMockRoute({ height: 25, pitches: 1 }), // Single pitch
        createMockRoute({ height: 30, pitches: 1 }),
        createMockRoute({ height: 80, pitches: 3 }), // Multi-pitch
        createMockRoute({ height: 120, pitches: 5 }), // Multi-pitch
      ]

      // Act
      const stats = SectorStatsCalculatorService.calculateFromRoutes(routes)
      const heightStats = stats.getHeight()

      // Assert
      expect(heightStats.getTotalRoutes()).toBe(4)
      expect(heightStats.getMultiPitchCount()).toBe(2) // pitches > 1
      expect(heightStats.getSinglePitchCount()).toBe(2)
      expect(heightStats.getMaxHeight()).toBe(120)
    })
  })

  describe('Equipment Stats', () => {
    test('should calculate equipment stats from routes', () => {
      // Arrange
      const routes = [
        createMockRoute({ bolts: 10, hasTopo: true }),
        createMockRoute({ bolts: 8, hasTopo: true }),
        createMockRoute({ bolts: 12, hasTopo: false }),
        createMockRoute({ bolts: 6, hasTopo: true }),
      ]

      // Act
      const stats = SectorStatsCalculatorService.calculateFromRoutes(routes)
      const equipmentStats = stats.getEquipment()

      // Assert
      expect(equipmentStats.getTotalRoutes()).toBe(4)
      expect(equipmentStats.getAverageBolts()).toBe(9) // (10+8+12+6)/4
      expect(equipmentStats.getMaxBolts()).toBe(12)
      expect(equipmentStats.getRoutesWithTopoCount()).toBe(3)
    })
  })

  describe('Audience Profile', () => {
    test('should calculate audience profile from routes', () => {
      // Arrange - Mostly beginner routes
      const routes = [
        createMockRoute({ gradeBand: 15 }), // Beginner
        createMockRoute({ gradeBand: 18 }), // Beginner
        createMockRoute({ gradeBand: 20 }), // Beginner
        createMockRoute({ gradeBand: 22 }), // Beginner
        createMockRoute({ gradeBand: 28 }), // Intermediate
      ]

      // Act
      const stats = SectorStatsCalculatorService.calculateFromRoutes(routes)
      const audience = stats.getAudience()

      // Assert
      expect(audience.isBeginnerFriendly()).toBe(true)
      expect(audience.getPrimaryAudience()).toBe('beginner')
    })
  })

  describe('Comprehensive Stats', () => {
    test('should calculate comprehensive stats', () => {
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
          isSport: true,
        }),
        createMockRoute({
          gradeBand: 30,
          stars: 2,
          ascents: 60,
          height: 30,
          pitches: 1,
          bolts: 12,
          hasTopo: true,
          isSport: true,
        }),
      ]

      // Act
      const stats = SectorStatsCalculatorService.calculateFromRoutes(routes)

      // Assert
      expect(stats.isEmpty()).toBe(false)
      expect(stats.getOverallScore()).toBeGreaterThan(0)
      expect(stats.getSectorRating()).toBeGreaterThanOrEqual(1)
      expect(stats.getSectorRating()).toBeLessThanOrEqual(5)
    })

    test('should serialize to primitives', () => {
      // Arrange
      const routes = [createMockRoute(), createMockRoute()]

      // Act
      const stats = SectorStatsCalculatorService.calculateFromRoutes(routes)
      const primitives = stats.toPrimitives()

      // Assert
      expect(primitives).toHaveProperty('gradeDistribution')
      expect(primitives).toHaveProperty('styleDistribution')
      expect(primitives).toHaveProperty('quality')
      expect(primitives).toHaveProperty('popularity')
      expect(primitives).toHaveProperty('height')
      expect(primitives).toHaveProperty('equipment')
      expect(primitives).toHaveProperty('audience')
      expect(primitives).toHaveProperty('overallScore')
    })
  })
})
