import { describe, expect, test } from 'bun:test'
import { Crag } from '@crags/domain/entities/crag.entity'
import { ScoredCragResult } from '../scored-crag-result.vo'

describe('ScoredCragResult Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create scored crag result with crag, total score, distance, breakdown
  // 2. ✓ Get crag
  // 3. ✓ Get total score
  // 4. ✓ Get distance in km
  // 5. ✓ Get score breakdown
  // 6. ✓ Score breakdown contains all strategy scores with weights
  // 7. ✓ Calculate weighted scores correctly

  // Helper to create a mock crag
  function createMockCrag(): Crag {
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

  test('should create scored crag result with all properties', () => {
    const crag = createMockCrag()
    const breakdown = {
      distance: { score: 90, weight: 0.4, weighted: 36 },
      gradeMatch: { score: 80, weight: 0.3, weighted: 24 },
      seasonality: { score: 100, weight: 0.2, weighted: 20 },
      routeCount: { score: 65, weight: 0.1, weighted: 6.5 },
    }

    const result = ScoredCragResult.create(crag, 86.5, 12.3, breakdown)

    expect(result.getCrag()).toBe(crag)
    expect(result.getTotalScore()).toBe(86.5)
    expect(result.getDistanceKm()).toBe(12.3)
    expect(result.getScoreBreakdown()).toEqual(breakdown)
  })

  test('should get crag from result', () => {
    const crag = createMockCrag()
    const breakdown = {
      distance: { score: 90, weight: 0.4, weighted: 36 },
    }

    const result = ScoredCragResult.create(crag, 90, 10, breakdown)

    expect(result.getCrag()).toBe(crag)
  })

  test('should get total score', () => {
    const crag = createMockCrag()
    const breakdown = {
      distance: { score: 90, weight: 0.4, weighted: 36 },
    }

    const result = ScoredCragResult.create(crag, 85.5, 10, breakdown)

    expect(result.getTotalScore()).toBe(85.5)
  })

  test('should get distance in km', () => {
    const crag = createMockCrag()
    const breakdown = {
      distance: { score: 90, weight: 0.4, weighted: 36 },
    }

    const result = ScoredCragResult.create(crag, 90, 15.7, breakdown)

    expect(result.getDistanceKm()).toBe(15.7)
  })

  test('should get score breakdown with all strategies', () => {
    const crag = createMockCrag()
    const breakdown = {
      distance: { score: 90, weight: 0.4, weighted: 36 },
      gradeMatch: { score: 80, weight: 0.3, weighted: 24 },
      seasonality: { score: 100, weight: 0.2, weighted: 20 },
      routeCount: { score: 65, weight: 0.1, weighted: 6.5 },
    }

    const result = ScoredCragResult.create(crag, 86.5, 12.3, breakdown)

    const resultBreakdown = result.getScoreBreakdown()
    expect(resultBreakdown.distance.score).toBe(90)
    expect(resultBreakdown.distance.weight).toBe(0.4)
    expect(resultBreakdown.distance.weighted).toBe(36)
    expect(resultBreakdown.gradeMatch.score).toBe(80)
    expect(resultBreakdown.seasonality.score).toBe(100)
    expect(resultBreakdown.routeCount.score).toBe(65)
  })

  test('should validate weighted scores sum approximately to total', () => {
    const crag = createMockCrag()
    const breakdown = {
      distance: { score: 90, weight: 0.4, weighted: 36 },
      gradeMatch: { score: 80, weight: 0.3, weighted: 24 },
      seasonality: { score: 100, weight: 0.2, weighted: 20 },
      routeCount: { score: 65, weight: 0.1, weighted: 6.5 },
    }

    const result = ScoredCragResult.create(crag, 86.5, 12.3, breakdown)

    // Sum of weighted scores
    const sum =
      breakdown.distance.weighted +
      breakdown.gradeMatch.weighted +
      breakdown.seasonality.weighted +
      breakdown.routeCount.weighted

    expect(sum).toBe(86.5)
    expect(result.getTotalScore()).toBe(sum)
  })
})
