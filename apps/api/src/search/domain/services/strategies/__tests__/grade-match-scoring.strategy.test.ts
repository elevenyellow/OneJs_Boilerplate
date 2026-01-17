import { describe, expect, test } from 'bun:test'
import { Crag } from '@crags/domain/entities/crag.entity'
import { Coordinates } from '@crags/domain/value-objects'
import { GradeRange } from '../../../value-objects/grade-range.vo'
import { SearchCriteria } from '../../../value-objects/search-criteria.vo'
import { GradeMatchScoringStrategy } from '../grade-match-scoring.strategy'

describe('GradeMatchScoringStrategy', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Strategy name is 'gradeMatch'
  // 2. ✓ Score is 3 when all routes are in range
  // 3. ✓ Score is 0 when no routes are in range
  // 4. ✓ Score is proportional to percentage of routes in range
  // 5. ✓ Score is 1.5 when 50% of routes are in range
  // 6. ✓ Returns details with percentage

  function createMockCrag(gbRoutes: number[]): Crag {
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
      numberRoutes: 50,
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

  test('should return strategy name as gradeMatch', () => {
    const strategy = new GradeMatchScoringStrategy()
    expect(strategy.getName()).toBe('gradeMatch')
  })

  test('should score 3 when all routes are in the desired range', () => {
    const strategy = new GradeMatchScoringStrategy()

    const gbRoutes = new Array(100).fill(0)
    gbRoutes[24] = 10 // 6a
    gbRoutes[25] = 20 // 6a+
    gbRoutes[28] = 30 // 6c
    // All 60 routes are in range 24-30

    const crag = createMockCrag(gbRoutes)
    const gradeRange = GradeRange.create(24, 30) // 6a to 7a
    const coords = Coordinates.createFrom(41.7, 1.8)
    const criteria = SearchCriteria.create(coords, 50, gradeRange)

    const result = strategy.calculate(crag, criteria)

    expect(result.score).toBe(3)
  })

  test('should score 0 when no routes are in the desired range', () => {
    const strategy = new GradeMatchScoringStrategy()

    const gbRoutes = new Array(100).fill(0)
    gbRoutes[20] = 30 // 5b (out of range)
    gbRoutes[35] = 20 // 7c+ (out of range)

    const crag = createMockCrag(gbRoutes)
    const gradeRange = GradeRange.create(24, 30) // 6a to 7a
    const coords = Coordinates.createFrom(41.7, 1.8)
    const criteria = SearchCriteria.create(coords, 50, gradeRange)

    const result = strategy.calculate(crag, criteria)

    expect(result.score).toBe(0)
  })

  test('should score proportionally when 50% of routes are in range', () => {
    const strategy = new GradeMatchScoringStrategy()

    const gbRoutes = new Array(100).fill(0)
    gbRoutes[25] = 25 // 25 routes in range
    gbRoutes[28] = 25 // 25 routes in range
    gbRoutes[20] = 25 // 25 routes out of range
    gbRoutes[35] = 25 // 25 routes out of range
    // Total: 100 routes, 50 in range = 50%

    const crag = createMockCrag(gbRoutes)
    const gradeRange = GradeRange.create(24, 30)
    const coords = Coordinates.createFrom(41.7, 1.8)
    const criteria = SearchCriteria.create(coords, 50, gradeRange)

    const result = strategy.calculate(crag, criteria)

    // 50% of 3 = 1.5
    expect(result.score).toBe(1.5)
  })

  test('should include percentage in details', () => {
    const strategy = new GradeMatchScoringStrategy()

    const gbRoutes = new Array(100).fill(0)
    gbRoutes[25] = 30 // In range
    gbRoutes[35] = 20 // Out of range

    const crag = createMockCrag(gbRoutes)
    const gradeRange = GradeRange.create(24, 30)
    const coords = Coordinates.createFrom(41.7, 1.8)
    const criteria = SearchCriteria.create(coords, 50, gradeRange)

    const result = strategy.calculate(crag, criteria)

    expect(result.details).toBeDefined()
    expect(result.details?.percentageInRange).toBeDefined()
    expect(typeof result.details?.percentageInRange).toBe('number')
  })

  test('should score 0 when crag has no routes', () => {
    const strategy = new GradeMatchScoringStrategy()

    const gbRoutes = new Array(100).fill(0)
    const crag = createMockCrag(gbRoutes)
    const gradeRange = GradeRange.create(24, 30)
    const coords = Coordinates.createFrom(41.7, 1.8)
    const criteria = SearchCriteria.create(coords, 50, gradeRange)

    const result = strategy.calculate(crag, criteria)

    expect(result.score).toBe(0)
  })
})
