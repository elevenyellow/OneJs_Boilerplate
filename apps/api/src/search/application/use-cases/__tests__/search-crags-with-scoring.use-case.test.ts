import { describe, expect, test, mock } from 'bun:test'
import { Crag } from '@crags/domain/entities/crag.entity'
import { Coordinates } from '@crags/domain/value-objects'
import type { SearchCragRepository } from '../../../infrastructure/persistence/search-crag.repository'
import { GradeRange } from '../../../domain/value-objects/grade-range.vo'
import { SearchCriteria } from '../../../domain/value-objects/search-criteria.vo'
import { SeasonPreference } from '../../../domain/types/seasonality.types'
import { CragScoringService } from '../../../domain/services/crag-scoring.service'
import { DistanceScoringStrategy } from '../../../domain/services/strategies/distance-scoring.strategy'
import { GradeMatchScoringStrategy } from '../../../domain/services/strategies/grade-match-scoring.strategy'
import { SearchCragsWithScoringUseCase } from '../search-crags-with-scoring.use-case'

describe('SearchCragsWithScoringUseCase', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Execute search and return scored results
  // 2. ✓ Results are ordered by score descending
  // 3. ✓ Respects limit from criteria
  // 4. ✓ Returns empty array when no crags match
  // 5. ✓ Calls repository with correct criteria
  // 6. ✓ Each result has crag, score, distance, breakdown

  function createMockCrag(id: string, lat: number, lng: number): Crag {
    const gbRoutes = new Array(100).fill(0)
    gbRoutes[25] = 20

    return Crag.create({
      id: id,
      externalId: `ext-${id}`,
      zoneId: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Test Crag',
      asciiName: 'Test Crag',
      type: 'crag',
      subType: 'sport',
      urlStub: 'test-crag',
      urlAncestorStub: null,
      headerImage: null,
      latitude: lat,
      longitude: lng,
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

  test('should execute search and return scored results', async () => {
    const mockCrags = [
      createMockCrag('550e8400-e29b-41d4-a716-446655440010', 41.7, 1.8),
      createMockCrag('550e8400-e29b-41d4-a716-446655440011', 41.8, 1.9),
    ]

    const mockRepository = {
      findBySearchCriteria: mock(async () => mockCrags),
    } as unknown as SearchCragRepository

    const scoringService = new CragScoringService([
      { strategy: new DistanceScoringStrategy(), weight: 0.6 },
      { strategy: new GradeMatchScoringStrategy(), weight: 0.4 },
    ])

    const useCase = new SearchCragsWithScoringUseCase(
      mockRepository,
      scoringService,
    )

    const coords = Coordinates.createFrom(41.7, 1.8)
    const gradeRange = GradeRange.create(24, 30)
    const criteria = SearchCriteria.create(coords, 50, gradeRange)

    const results = await useCase.execute(criteria)

    expect(results).toBeInstanceOf(Array)
    expect(results.length).toBeGreaterThan(0)
    expect(mockRepository.findBySearchCriteria).toHaveBeenCalledWith(criteria)
  })

  test('should return results ordered by score descending', async () => {
    const mockCrags = [
      createMockCrag('550e8400-e29b-41d4-a716-446655440010', 41.7, 1.8), // Close - high score
      createMockCrag('550e8400-e29b-41d4-a716-446655440011', 42.0, 2.0), // Far - low score
    ]

    const mockRepository = {
      findBySearchCriteria: mock(async () => mockCrags),
    } as unknown as SearchCragRepository

    const scoringService = new CragScoringService([
      { strategy: new DistanceScoringStrategy(), weight: 1.0 },
    ])

    const useCase = new SearchCragsWithScoringUseCase(
      mockRepository,
      scoringService,
    )

    const coords = Coordinates.createFrom(41.7, 1.8)
    const gradeRange = GradeRange.create(24, 30)
    const criteria = SearchCriteria.create(coords, 50, gradeRange)

    const results = await useCase.execute(criteria)

    expect(results.length).toBe(2)
    // First result should have higher score than second
    expect(results[0].getTotalScore()).toBeGreaterThan(
      results[1].getTotalScore(),
    )
  })

  test('should respect limit from criteria', async () => {
    const mockCrags = [
      createMockCrag('550e8400-e29b-41d4-a716-446655440010', 41.7, 1.8),
      createMockCrag('550e8400-e29b-41d4-a716-446655440011', 41.71, 1.81),
      createMockCrag('550e8400-e29b-41d4-a716-446655440012', 41.72, 1.82),
    ]

    const mockRepository = {
      findBySearchCriteria: mock(async () => mockCrags),
    } as unknown as SearchCragRepository

    const scoringService = new CragScoringService([
      { strategy: new DistanceScoringStrategy(), weight: 1.0 },
    ])

    const useCase = new SearchCragsWithScoringUseCase(
      mockRepository,
      scoringService,
    )

    const coords = Coordinates.createFrom(41.7, 1.8)
    const gradeRange = GradeRange.create(24, 30)
    const criteria = SearchCriteria.create(
      coords,
      50,
      gradeRange,
      SeasonPreference.SUMMER,
      2, // Limit 2
    )

    const results = await useCase.execute(criteria)

    expect(results.length).toBe(2) // Should respect limit
  })

  test('should return empty array when no crags match', async () => {
    const mockRepository = {
      findBySearchCriteria: mock(async () => []),
    } as unknown as SearchCragRepository

    const scoringService = new CragScoringService([
      { strategy: new DistanceScoringStrategy(), weight: 1.0 },
    ])

    const useCase = new SearchCragsWithScoringUseCase(
      mockRepository,
      scoringService,
    )

    const coords = Coordinates.createFrom(41.7, 1.8)
    const gradeRange = GradeRange.create(24, 30)
    const criteria = SearchCriteria.create(coords, 50, gradeRange)

    const results = await useCase.execute(criteria)

    expect(results).toEqual([])
  })

  test('should include all required fields in each result', async () => {
    const mockCrag = createMockCrag(
      '550e8400-e29b-41d4-a716-446655440010',
      41.7,
      1.8,
    )

    const mockRepository = {
      findBySearchCriteria: mock(async () => [mockCrag]),
    } as unknown as SearchCragRepository

    const scoringService = new CragScoringService([
      { strategy: new DistanceScoringStrategy(), weight: 0.5 },
      { strategy: new GradeMatchScoringStrategy(), weight: 0.5 },
    ])

    const useCase = new SearchCragsWithScoringUseCase(
      mockRepository,
      scoringService,
    )

    const coords = Coordinates.createFrom(41.7, 1.8)
    const gradeRange = GradeRange.create(24, 30)
    const criteria = SearchCriteria.create(coords, 50, gradeRange)

    const results = await useCase.execute(criteria)

    expect(results.length).toBe(1)
    const result = results[0]

    expect(result.getCrag()).toBeDefined()
    expect(result.getTotalScore()).toBeDefined()
    expect(result.getDistanceKm()).toBeDefined()
    expect(result.getScoreBreakdown()).toBeDefined()
  })
})
