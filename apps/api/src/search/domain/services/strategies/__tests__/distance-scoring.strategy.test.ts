import { describe, expect, test } from 'bun:test'
import { Crag } from '@crags/domain/entities/crag.entity'
import { Coordinates } from '@crags/domain/value-objects'
import { GradeRange } from '../../../value-objects/grade-range.vo'
import { SearchCriteria } from '../../../value-objects/search-criteria.vo'
import { DistanceScoringStrategy } from '../distance-scoring.strategy'

describe('DistanceScoringStrategy', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Strategy name is 'distance'
  // 2. ✓ Score is 3 for crag at exact location (0 km)
  // 3. ✓ Score is 0 for crag at radius limit
  // 4. ✓ Score decreases linearly with distance
  // 5. ✓ Score is approximately 1.5 for mid-distance (50% of radius)
  // 6. ✓ Returns details with calculated distance

  function createMockCrag(lat: number, lng: number): Crag {
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
      latitude: lat,
      longitude: lng,
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

  test('should return strategy name as distance', () => {
    const strategy = new DistanceScoringStrategy()
    expect(strategy.getName()).toBe('distance')
  })

  test('should score 3 for crag at exact search location (0 km)', () => {
    const strategy = new DistanceScoringStrategy()
    const searchCoords = Coordinates.createFrom(41.7, 1.8)
    const crag = createMockCrag(41.7, 1.8) // Same location
    const gradeRange = GradeRange.create(24, 30)
    const criteria = SearchCriteria.create(searchCoords, 50, gradeRange)

    const result = strategy.calculate(crag, criteria)

    expect(result.score).toBe(3)
  })

  test('should score 0 for crag at radius limit', () => {
    const strategy = new DistanceScoringStrategy()
    const searchCoords = Coordinates.createFrom(41.7, 1.8)
    // Place crag at approximately 50km distance
    const crag = createMockCrag(42.15, 1.8) // ~50km north
    const gradeRange = GradeRange.create(24, 30)
    const criteria = SearchCriteria.create(searchCoords, 50, gradeRange)

    const result = strategy.calculate(crag, criteria)

    // Should be approximately 0 (within tolerance for 0-3 scale)
    expect(result.score).toBeLessThanOrEqual(0.15)
    expect(result.score).toBeGreaterThanOrEqual(0)
  })

  test('should decrease score linearly with distance', () => {
    const strategy = new DistanceScoringStrategy()
    const searchCoords = Coordinates.createFrom(41.7, 1.8)
    const gradeRange = GradeRange.create(24, 30)
    const radiusKm = 50

    // Crag at 25km (50% of radius) should score ~1.5 (50% of 3)
    const cragAt25km = createMockCrag(41.925, 1.8) // ~25km north
    const criteria25 = SearchCriteria.create(searchCoords, radiusKm, gradeRange)
    const result25 = strategy.calculate(cragAt25km, criteria25)

    // Should be approximately 1.5 (within tolerance for 0-3 scale)
    expect(result25.score).toBeGreaterThan(1.2)
    expect(result25.score).toBeLessThan(1.8)
  })

  test('should include distance in details', () => {
    const strategy = new DistanceScoringStrategy()
    const searchCoords = Coordinates.createFrom(41.7, 1.8)
    const crag = createMockCrag(41.8, 1.9)
    const gradeRange = GradeRange.create(24, 30)
    const criteria = SearchCriteria.create(searchCoords, 50, gradeRange)

    const result = strategy.calculate(crag, criteria)

    expect(result.details).toBeDefined()
    expect(result.details?.distanceKm).toBeDefined()
    expect(typeof result.details?.distanceKm).toBe('number')
    expect(result.details?.distanceKm).toBeGreaterThan(0)
  })

  test('should handle crag without coordinates gracefully', () => {
    const strategy = new DistanceScoringStrategy()
    const searchCoords = Coordinates.createFrom(41.7, 1.8)
    const crag = createMockCrag(0, 0) // Invalid/no coordinates
    const gradeRange = GradeRange.create(24, 30)
    const criteria = SearchCriteria.create(searchCoords, 50, gradeRange)

    const result = strategy.calculate(crag, criteria)

    // Should still return a valid score (0 for very far) on 0-3 scale
    expect(result.score).toBeDefined()
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(3)
  })
})
