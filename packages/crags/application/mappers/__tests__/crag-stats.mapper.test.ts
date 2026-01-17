import { describe, expect, test } from 'bun:test'
import {
  CragStatsMapper,
  type RouteDataForCragStats,
  type SectorSummary,
} from '../crag-stats.mapper'
import { ClimbingStyle } from '@routes/domain/value-objects'

describe('CragStatsMapper', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Calculate stats from empty routes array
  // 2. ✓ Calculate stats from routes across multiple sectors
  // 3. ✓ Identify best sector correctly
  // 4. ✓ Calculate aggregated style distribution
  // 5. ✓ Calculate from grade bands only

  const createMockRoute = (
    overrides: Partial<RouteDataForCragStats> = {},
  ): RouteDataForCragStats => ({
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
    sectorId: 'sector-1',
    ...overrides,
  })

  const createMockSector = (
    id: string,
    name: string,
    score: number,
  ): SectorSummary => ({
    id,
    name,
    overallScore: score,
  })

  describe('Calculate From Routes', () => {
    test('should return minimal stats for empty routes array', () => {
      // Arrange
      const routes: RouteDataForCragStats[] = []
      const sectors: SectorSummary[] = []

      // Act
      const result = CragStatsMapper.calculateFromRoutes(routes, sectors)

      // Assert - Empty array should have null/0 values for route counts
      expect(result.sportCount).toBe(0)
      expect(result.tradCount).toBe(0)
      expect(result.totalAscents).toBe(0)
      expect(result.sectorCount).toBe(0)
      expect(result.minGradeIndex).toBeNull()
      expect(result.maxGradeIndex).toBeNull()
    })

    test('should calculate stats from routes across multiple sectors', () => {
      // Arrange
      const routes = [
        createMockRoute({ sectorId: 'sector-1', gradeBand: 25, ascents: 100 }),
        createMockRoute({ sectorId: 'sector-1', gradeBand: 28, ascents: 80 }),
        createMockRoute({ sectorId: 'sector-2', gradeBand: 30, ascents: 50 }),
        createMockRoute({ sectorId: 'sector-2', gradeBand: 35, ascents: 30 }),
      ]
      const sectors = [
        createMockSector('sector-1', 'North Wall', 75),
        createMockSector('sector-2', 'South Face', 60),
      ]

      // Act
      const result = CragStatsMapper.calculateFromRoutes(routes, sectors)

      // Assert
      expect(result.sectorCount).toBe(2)
      expect(result.totalAscents).toBe(260)
      expect(result.overallScore).toBeGreaterThan(0)
    })

    test('should identify best sector correctly', () => {
      // Arrange
      const routes = [
        createMockRoute({ sectorId: 'sector-1', gradeBand: 25 }),
        createMockRoute({ sectorId: 'sector-2', gradeBand: 30 }),
      ]
      const sectors = [
        createMockSector('sector-1', 'Low Score Sector', 40),
        createMockSector('sector-2', 'High Score Sector', 85),
        createMockSector('sector-3', 'Medium Score Sector', 60),
      ]

      // Act
      const result = CragStatsMapper.calculateFromRoutes(routes, sectors)

      // Assert
      expect(result.bestSectorId).toBe('sector-2')
      expect(result.bestSectorName).toBe('High Score Sector')
      expect(result.bestSectorScore).toBe(85)
    })

    test('should calculate aggregated style distribution', () => {
      // Arrange
      const routes = [
        createMockRoute({ styleFlags: ClimbingStyle.SPORT, gradeBand: 25 }),
        createMockRoute({ styleFlags: ClimbingStyle.SPORT, gradeBand: 26 }),
        createMockRoute({ styleFlags: ClimbingStyle.SPORT, gradeBand: 27 }),
        createMockRoute({ styleFlags: ClimbingStyle.TRAD, gradeBand: 28 }),
        createMockRoute({ styleFlags: ClimbingStyle.TRAD, gradeBand: 29 }),
      ]
      const sectors: SectorSummary[] = []

      // Act
      const result = CragStatsMapper.calculateFromRoutes(routes, sectors)

      // Assert
      expect(result.sportCount).toBe(3)
      expect(result.tradCount).toBe(2)
      expect(result.primaryStyle).toBe('sport')
    })
  })

  describe('Calculate From Grade Bands', () => {
    test('should calculate stats from grade bands', () => {
      // Arrange - Array where index = grade band, value = route count
      const gbRoutes = new Array(53).fill(0)
      gbRoutes[20] = 15
      gbRoutes[25] = 25
      gbRoutes[30] = 10
      gbRoutes[35] = 5

      // Act
      const result = CragStatsMapper.calculateFromGradeBands(gbRoutes, null, 5)

      // Assert
      expect(result.minGradeIndex).toBe(20)
      expect(result.maxGradeIndex).toBe(35)
      expect(result.modeGradeIndex).toBe(25)
      expect(result.sectorCount).toBe(5)
    })

    test('should handle null input', () => {
      // Act
      const result = CragStatsMapper.calculateFromGradeBands(null, null, 0)

      // Assert
      expect(result.minGradeIndex).toBeNull()
      expect(result.maxGradeIndex).toBeNull()
      expect(result.sectorCount).toBe(0)
    })
  })
})
