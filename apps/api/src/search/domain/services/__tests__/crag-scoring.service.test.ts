import { describe, expect, test } from 'bun:test'
import { Crag } from '@crags/domain/entities/crag.entity'
import { Coordinates } from '@crags/domain/value-objects'
import { SeasonPreference } from '../../types/seasonality.types'
import { GradeRange } from '../../value-objects/grade-range.vo'
import { SearchCriteria } from '../../value-objects/search-criteria.vo'
import { CragScoringService } from '../crag-scoring.service'
import { DistanceScoringStrategy } from '../strategies/distance-scoring.strategy'
import { GradeMatchScoringStrategy } from '../strategies/grade-match-scoring.strategy'
import { RouteCountScoringStrategy } from '../strategies/route-count-scoring.strategy'
import { SeasonalityScoringStrategy } from '../strategies/seasonality-scoring.strategy'

describe('CragScoringService', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Calculate weighted score using multiple strategies
  // 2. ✓ Score breakdown includes all strategies
  // 3. ✓ Weighted scores sum to total score
  // 4. ✓ Works with single strategy
  // 5. ✓ Validates weights sum to 1.0
  // 6. ✓ Calculate distance and include in result

  function createMockCrag(): Crag {
    const gbRoutes = new Array(100).fill(0)
    gbRoutes[25] = 50 // 50 routes at 6a+

    return Crag.create({
      id: '550e8400-e29b-41d4-a716-446655440000',
      externalId: 'ext-1',
      zoneId: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Test Crag',
      asciiName: 'Test Crag',
      type: 'crag',
      subType: 'sport',
      urlStub: 'test-crag',
      urlAncestorStub: null,
      headerImage: null,
      latitude: 41.7,
      longitude: 1.8,
      areaSize: null,
      geometry: null,
      numberRoutes: 100,
      numberPhotos: 10,
      numberTopos: 5,
      ascentCount: 100,
      kudos: 20,
      totalFavorites: 15,
      averageHeight: 25,
      averageHeightUnit: 'm',
      gbAscents: new Array(100).fill(0),
      gbRoutes: gbRoutes,
      beta: null,
      styles: null,
      tags: null,
      altNames: null,
      seasonality: [6, 7, 8, 9],
      hasTopo: true,
      hasSectors: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  test('should calculate weighted score using multiple strategies', () => {
    const service = new CragScoringService([
      { strategy: new DistanceScoringStrategy(), weight: 0.4 },
      { strategy: new GradeMatchScoringStrategy(), weight: 0.3 },
      { strategy: new SeasonalityScoringStrategy(), weight: 0.2 },
      { strategy: new RouteCountScoringStrategy(), weight: 0.1 },
    ])

    const crag = createMockCrag()
    const coords = Coordinates.createFrom(41.7, 1.8)
    const gradeRange = GradeRange.create(24, 30)
    const criteria = SearchCriteria.create(
      coords,
      50,
      gradeRange,
      SeasonPreference.SUMMER,
    )

    const result = service.calculateScore(crag, criteria)

    expect(result.getTotalScore()).toBeGreaterThan(0)
    // Max score is now 3 (not 100)
    expect(result.getTotalScore()).toBeLessThanOrEqual(3)
    expect(result.getCrag()).toBe(crag)
  })

  test('should include all strategies in score breakdown', () => {
    const service = new CragScoringService([
      { strategy: new DistanceScoringStrategy(), weight: 0.4 },
      { strategy: new GradeMatchScoringStrategy(), weight: 0.3 },
      { strategy: new SeasonalityScoringStrategy(), weight: 0.2 },
      { strategy: new RouteCountScoringStrategy(), weight: 0.1 },
    ])

    const crag = createMockCrag()
    const coords = Coordinates.createFrom(41.7, 1.8)
    const gradeRange = GradeRange.create(24, 30)
    const criteria = SearchCriteria.create(coords, 50, gradeRange)

    const result = service.calculateScore(crag, criteria)
    const breakdown = result.getScoreBreakdown()

    expect(breakdown.distance).toBeDefined()
    expect(breakdown.gradeMatch).toBeDefined()
    expect(breakdown.seasonality).toBeDefined()
    expect(breakdown.routeCount).toBeDefined()
  })

  test('should sum weighted scores to total score', () => {
    const service = new CragScoringService([
      { strategy: new DistanceScoringStrategy(), weight: 0.5 },
      { strategy: new GradeMatchScoringStrategy(), weight: 0.5 },
    ])

    const crag = createMockCrag()
    const coords = Coordinates.createFrom(41.7, 1.8)
    const gradeRange = GradeRange.create(24, 30)
    const criteria = SearchCriteria.create(coords, 50, gradeRange)

    const result = service.calculateScore(crag, criteria)
    const breakdown = result.getScoreBreakdown()

    const sum =
      breakdown.distance.weighted +
      breakdown.gradeMatch.weighted +
      (breakdown.seasonality?.weighted ?? 0) +
      (breakdown.routeCount?.weighted ?? 0)

    expect(result.getTotalScore()).toBeCloseTo(sum, 1)
  })

  test('should work with single strategy', () => {
    const service = new CragScoringService([
      { strategy: new DistanceScoringStrategy(), weight: 1.0 },
    ])

    const crag = createMockCrag()
    const coords = Coordinates.createFrom(41.7, 1.8)
    const gradeRange = GradeRange.create(24, 30)
    const criteria = SearchCriteria.create(coords, 50, gradeRange)

    const result = service.calculateScore(crag, criteria)

    expect(result.getTotalScore()).toBeGreaterThan(0)
    expect(result.getScoreBreakdown().distance).toBeDefined()
  })

  test('should throw error when weights do not sum to 1.0', () => {
    expect(
      () =>
        new CragScoringService([
          { strategy: new DistanceScoringStrategy(), weight: 0.4 },
          { strategy: new GradeMatchScoringStrategy(), weight: 0.4 }, // Total = 0.8
        ]),
    ).toThrow('weights must sum to 1.0')
  })

  test('should calculate distance and include in result', () => {
    const service = new CragScoringService([
      { strategy: new DistanceScoringStrategy(), weight: 1.0 },
    ])

    const crag = createMockCrag()
    const coords = Coordinates.createFrom(41.8, 1.9) // Different location
    const gradeRange = GradeRange.create(24, 30)
    const criteria = SearchCriteria.create(coords, 50, gradeRange)

    const result = service.calculateScore(crag, criteria)

    expect(result.getDistanceKm()).toBeGreaterThan(0)
  })
})
