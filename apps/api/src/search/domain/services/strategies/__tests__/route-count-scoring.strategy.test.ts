import { describe, expect, test } from 'bun:test'
import { Crag } from '@crags/domain/entities/crag.entity'
import { Coordinates } from '@crags/domain/value-objects'
import { GradeRange } from '../../../value-objects/grade-range.vo'
import { SearchCriteria } from '../../../value-objects/search-criteria.vo'
import { RouteCountScoringStrategy } from '../route-count-scoring.strategy'

describe('RouteCountScoringStrategy', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Strategy name is 'routeCount'
  // 2. ✓ Score is 3 for crag with 200+ routes
  // 3. ✓ Score is 0 for crag with 0 routes
  // 4. ✓ Score scales linearly between 0 and 200 routes
  // 5. ✓ Score is 1.5 for crag with 100 routes (50%)
  // 6. ✓ Returns details with route count

  function createMockCrag(numberRoutes: number): Crag {
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
      numberRoutes: numberRoutes,
      numberPhotos: 10,
      numberTopos: 5,
      ascentCount: 100,
      kudos: 20,
      totalFavorites: 15,
      averageHeight: 25,
      averageHeightUnit: 'm',
      gbAscents: new Array(100).fill(0),
      gbRoutes: new Array(100).fill(0),
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

  test('should return strategy name as routeCount', () => {
    const strategy = new RouteCountScoringStrategy()
    expect(strategy.getName()).toBe('routeCount')
  })

  test('should score 3 for crag with 200 or more routes', () => {
    const strategy = new RouteCountScoringStrategy()
    const crag = createMockCrag(200)
    const coords = Coordinates.createFrom(41.7, 1.8)
    const gradeRange = GradeRange.create(24, 30)
    const criteria = SearchCriteria.create(coords, 50, gradeRange)

    const result = strategy.calculate(crag, criteria)

    expect(result.score).toBe(3)
  })

  test('should score 3 for crag with more than 200 routes', () => {
    const strategy = new RouteCountScoringStrategy()
    const crag = createMockCrag(350)
    const coords = Coordinates.createFrom(41.7, 1.8)
    const gradeRange = GradeRange.create(24, 30)
    const criteria = SearchCriteria.create(coords, 50, gradeRange)

    const result = strategy.calculate(crag, criteria)

    expect(result.score).toBe(3)
  })

  test('should score 0 for crag with 0 routes', () => {
    const strategy = new RouteCountScoringStrategy()
    const crag = createMockCrag(0)
    const coords = Coordinates.createFrom(41.7, 1.8)
    const gradeRange = GradeRange.create(24, 30)
    const criteria = SearchCriteria.create(coords, 50, gradeRange)

    const result = strategy.calculate(crag, criteria)

    expect(result.score).toBe(0)
  })

  test('should score 1.5 for crag with 100 routes', () => {
    const strategy = new RouteCountScoringStrategy()
    const crag = createMockCrag(100)
    const coords = Coordinates.createFrom(41.7, 1.8)
    const gradeRange = GradeRange.create(24, 30)
    const criteria = SearchCriteria.create(coords, 50, gradeRange)

    const result = strategy.calculate(crag, criteria)

    // 100/200 = 50% = 1.5 on 0-3 scale
    expect(result.score).toBe(1.5)
  })

  test('should scale linearly between 0 and 200 routes', () => {
    const strategy = new RouteCountScoringStrategy()
    const coords = Coordinates.createFrom(41.7, 1.8)
    const gradeRange = GradeRange.create(24, 30)
    const criteria = SearchCriteria.create(coords, 50, gradeRange)

    const crag50 = createMockCrag(50)
    const result50 = strategy.calculate(crag50, criteria)
    expect(result50.score).toBe(0.75) // 50/200 * 3 = 0.75

    const crag150 = createMockCrag(150)
    const result150 = strategy.calculate(crag150, criteria)
    expect(result150.score).toBe(2.25) // 150/200 * 3 = 2.25
  })

  test('should include route count in details', () => {
    const strategy = new RouteCountScoringStrategy()
    const crag = createMockCrag(75)
    const coords = Coordinates.createFrom(41.7, 1.8)
    const gradeRange = GradeRange.create(24, 30)
    const criteria = SearchCriteria.create(coords, 50, gradeRange)

    const result = strategy.calculate(crag, criteria)

    expect(result.details).toBeDefined()
    expect(result.details?.routeCount).toBe(75)
  })

  test('should handle null route count gracefully', () => {
    const strategy = new RouteCountScoringStrategy()
    const crag = createMockCrag(0) // Will be null in stats
    const coords = Coordinates.createFrom(41.7, 1.8)
    const gradeRange = GradeRange.create(24, 30)
    const criteria = SearchCriteria.create(coords, 50, gradeRange)

    const result = strategy.calculate(crag, criteria)

    expect(result.score).toBe(0)
  })
})
