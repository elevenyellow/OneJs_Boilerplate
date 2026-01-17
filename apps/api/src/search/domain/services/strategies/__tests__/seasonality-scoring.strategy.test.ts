import { describe, expect, test } from 'bun:test'
import { Crag } from '@crags/domain/entities/crag.entity'
import { Coordinates } from '@crags/domain/value-objects'
import { SeasonPreference } from '../../../types/seasonality.types'
import { GradeRange } from '../../../value-objects/grade-range.vo'
import { SearchCriteria } from '../../../value-objects/search-criteria.vo'
import { SeasonalityScoringStrategy } from '../seasonality-scoring.strategy'

describe('SeasonalityScoringStrategy', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Strategy name is 'seasonality'
  // 2. ✓ Score is 3 when all crag months match season
  // 3. ✓ Score is 0 when no crag months match season
  // 4. ✓ Score is proportional to overlap between crag months and season (1.5 for 50%)
  // 5. ✓ Score is 3 for ANY season preference
  // 6. ✓ Returns details with matching months count

  function createMockCrag(seasonalityMonths: number[]): Crag {
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
      seasonality: seasonalityMonths,
      hasTopo: true,
      hasSectors: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  test('should return strategy name as seasonality', () => {
    const strategy = new SeasonalityScoringStrategy()
    expect(strategy.getName()).toBe('seasonality')
  })

  test('should score 3 when all crag months are in summer season', () => {
    const strategy = new SeasonalityScoringStrategy()
    const crag = createMockCrag([6, 7, 8, 9]) // All summer months
    const gradeRange = GradeRange.create(24, 30)
    const coords = Coordinates.createFrom(41.7, 1.8)
    const criteria = SearchCriteria.create(
      coords,
      50,
      gradeRange,
      SeasonPreference.SUMMER,
    )

    const result = strategy.calculate(crag, criteria)

    expect(result.score).toBe(3)
  })

  test('should score 0 when no crag months match the season', () => {
    const strategy = new SeasonalityScoringStrategy()
    const crag = createMockCrag([12, 1, 2]) // Winter months
    const gradeRange = GradeRange.create(24, 30)
    const coords = Coordinates.createFrom(41.7, 1.8)
    const criteria = SearchCriteria.create(
      coords,
      50,
      gradeRange,
      SeasonPreference.SUMMER,
    )

    const result = strategy.calculate(crag, criteria)

    expect(result.score).toBe(0)
  })

  test('should score proportionally based on overlap', () => {
    const strategy = new SeasonalityScoringStrategy()
    // Crag has 2 out of 4 summer months
    const crag = createMockCrag([6, 7, 10, 11]) // June, July (summer) + Oct, Nov (not summer)
    const gradeRange = GradeRange.create(24, 30)
    const coords = Coordinates.createFrom(41.7, 1.8)
    const criteria = SearchCriteria.create(
      coords,
      50,
      gradeRange,
      SeasonPreference.SUMMER, // [6,7,8,9]
    )

    const result = strategy.calculate(crag, criteria)

    // 2 out of 4 summer months = 50% overlap = 1.5 on 0-3 scale
    expect(result.score).toBe(1.5)
  })

  test('should score 3 for ANY season preference', () => {
    const strategy = new SeasonalityScoringStrategy()
    const crag = createMockCrag([1, 2, 3]) // Any months
    const gradeRange = GradeRange.create(24, 30)
    const coords = Coordinates.createFrom(41.7, 1.8)
    const criteria = SearchCriteria.create(
      coords,
      50,
      gradeRange,
      SeasonPreference.ANY,
    )

    const result = strategy.calculate(crag, criteria)

    expect(result.score).toBe(3)
  })

  test('should return details with matching months count', () => {
    const strategy = new SeasonalityScoringStrategy()
    const crag = createMockCrag([6, 7, 8])
    const gradeRange = GradeRange.create(24, 30)
    const coords = Coordinates.createFrom(41.7, 1.8)
    const criteria = SearchCriteria.create(
      coords,
      50,
      gradeRange,
      SeasonPreference.SUMMER,
    )

    const result = strategy.calculate(crag, criteria)

    expect(result.details).toBeDefined()
    expect(result.details?.matchingMonths).toBeDefined()
    expect(result.details?.matchingMonths).toBe(3)
  })

  test('should handle winter season correctly', () => {
    const strategy = new SeasonalityScoringStrategy()
    const crag = createMockCrag([12, 1, 2, 3]) // All winter months
    const gradeRange = GradeRange.create(24, 30)
    const coords = Coordinates.createFrom(41.7, 1.8)
    const criteria = SearchCriteria.create(
      coords,
      50,
      gradeRange,
      SeasonPreference.WINTER,
    )

    const result = strategy.calculate(crag, criteria)

    expect(result.score).toBe(3)
  })

  // Tests for score format (12-element arrays with scores > 12)
  describe('Score format support (theCrag API format)', () => {
    test('should score correctly for summer crag with score format', () => {
      const strategy = new SeasonalityScoringStrategy()
      // Score format: low winter (20-30), high summer (90-98)
      // Good months will be May-Sep (indices where score >= threshold)
      // threshold = 20 + (98-20)*0.5 = 59
      // Months with score >= 59: May(70), Jun(90), Jul(95), Aug(98), Sep(95), Oct(80) = indices 4,5,6,7,8,9
      const summerCragScores = [20, 25, 40, 50, 70, 90, 95, 98, 95, 80, 50, 22]
      const crag = createMockCrag(summerCragScores)
      const gradeRange = GradeRange.create(24, 30)
      const coords = Coordinates.createFrom(41.7, 1.8)
      const criteria = SearchCriteria.create(
        coords,
        50,
        gradeRange,
        SeasonPreference.SUMMER, // [6,7,8,9]
      )

      const result = strategy.calculate(crag, criteria)

      // Good months from scores: Jun(6), Jul(7), Aug(8), Sep(9), May(5), Oct(10)
      // Summer months: 6,7,8,9 -> all 4 are in good months
      expect(result.score).toBe(3)
      expect(result.details?.matchingMonths).toBe(4)
    })

    test('should score correctly for winter crag with score format', () => {
      const strategy = new SeasonalityScoringStrategy()
      // Score format: high winter (80-92), low summer (10-15)
      // threshold = 10 + (92-10)*0.5 = 51
      const winterCragScores = [90, 85, 75, 50, 30, 15, 10, 12, 25, 55, 80, 92]
      const crag = createMockCrag(winterCragScores)
      const gradeRange = GradeRange.create(24, 30)
      const coords = Coordinates.createFrom(41.7, 1.8)
      const criteria = SearchCriteria.create(
        coords,
        50,
        gradeRange,
        SeasonPreference.WINTER, // [12,1,2,3]
      )

      const result = strategy.calculate(crag, criteria)

      // Good months from scores: Jan(90), Feb(85), Mar(75), Oct(55), Nov(80), Dec(92) >= 51
      // Winter months: 12,1,2,3 -> Dec(92), Jan(90), Feb(85), Mar(75) = all 4 match
      expect(result.score).toBe(3)
      expect(result.details?.matchingMonths).toBe(4)
    })

    test('should score 0 for summer preference on winter-only crag with score format', () => {
      const strategy = new SeasonalityScoringStrategy()
      // Winter crag with very low summer scores
      const winterOnlyScores = [90, 85, 75, 50, 30, 15, 10, 12, 25, 55, 80, 92]
      const crag = createMockCrag(winterOnlyScores)
      const gradeRange = GradeRange.create(24, 30)
      const coords = Coordinates.createFrom(41.7, 1.8)
      const criteria = SearchCriteria.create(
        coords,
        50,
        gradeRange,
        SeasonPreference.SUMMER, // [6,7,8,9]
      )

      const result = strategy.calculate(crag, criteria)

      // threshold = 51, summer months Jun(15), Jul(10), Aug(12), Sep(25) all < 51
      expect(result.score).toBe(0)
      expect(result.details?.matchingMonths).toBe(0)
    })

    test('should score proportionally for partial overlap with score format', () => {
      const strategy = new SeasonalityScoringStrategy()
      // Year-round crag with slight preference for spring/fall
      // Good months: Mar, Apr, May, Sep, Oct, Nov (6 months above threshold)
      const springFallScores = [40, 50, 75, 80, 70, 55, 45, 50, 70, 80, 75, 45]
      const crag = createMockCrag(springFallScores)
      const gradeRange = GradeRange.create(24, 30)
      const coords = Coordinates.createFrom(41.7, 1.8)
      const criteria = SearchCriteria.create(
        coords,
        50,
        gradeRange,
        SeasonPreference.SUMMER, // [6,7,8,9]
      )

      const result = strategy.calculate(crag, criteria)

      // threshold = 40 + (80-40)*0.5 = 60
      // Good months: Mar(75), Apr(80), May(70), Sep(70), Oct(80), Nov(75) >= 60
      // Summer months: Jun(55), Jul(45), Aug(50), Sep(70)
      // Only Sep(70) >= 60, so 1 out of 4 = 0.75
      expect(result.score).toBe(0.75)
      expect(result.details?.matchingMonths).toBe(1)
    })
  })
})
