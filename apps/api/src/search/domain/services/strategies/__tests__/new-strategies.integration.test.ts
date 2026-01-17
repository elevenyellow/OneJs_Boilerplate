import { describe, expect, test } from 'bun:test'
import { ExposureScoringStrategy } from '../exposure-scoring.strategy'
import { QualityScoringStrategy } from '../quality-scoring.strategy'
import { StyleScoringStrategy } from '../style-scoring.strategy'
import type { SearchCriteria } from '../../../value-objects/search-criteria.vo'
import type { Crag } from '@crags/domain/entities/crag.entity'

// Mock Crag for testing
class MockCrag {
  constructor(
    private seasonality: number[],
    private overallScore: number,
    private primaryStyle: string,
  ) {}

  getSeasonality() {
    return {
      getMonths: () => this.seasonality,
      // getGoodMonths returns the months that are good for climbing
      // For tests, we treat the seasonality array as month numbers (1-12)
      getGoodMonths: () => this.seasonality,
    }
  }

  getStats() {
    return {
      getOverallScore: () => this.overallScore,
      getStyleDistribution: () => ({
        getPrimaryStyle: () => this.primaryStyle,
      }),
    }
  }
}

// Mock SearchCriteria for testing
class MockSearchCriteria {
  constructor(
    private exposurePreference: 'sun' | 'shade' | 'any',
    private climbingStyles: string[],
    private minQualityRating: number,
  ) {}

  getExposurePreference() {
    return this.exposurePreference
  }

  getClimbingStyles() {
    return this.climbingStyles
  }

  getMinQualityRating() {
    return this.minQualityRating
  }
}

describe('ExposureScoringStrategy', () => {
  const strategy = new ExposureScoringStrategy()
  const MAX_SCORE = 3 // Using 0-3 scale

  test('should give MAX_SCORE for sun preference with winter seasonality', () => {
    const crag = new MockCrag([11, 12, 1, 2, 3], 2.5, 'sport')
    const criteria = new MockSearchCriteria('sun', [], 0)

    const result = strategy.calculate(
      crag as unknown as Crag,
      criteria as unknown as SearchCriteria,
    )

    expect(result.score).toBe(MAX_SCORE)
  })

  test('should give MAX_SCORE for shade preference with summer seasonality', () => {
    const crag = new MockCrag([5, 6, 7, 8, 9], 2.5, 'sport')
    const criteria = new MockSearchCriteria('shade', [], 0)

    const result = strategy.calculate(
      crag as unknown as Crag,
      criteria as unknown as SearchCriteria,
    )

    expect(result.score).toBe(MAX_SCORE)
  })

  test('should give 0 for sun preference with no winter seasonality', () => {
    const crag = new MockCrag([5, 6, 7, 8, 9], 2.5, 'sport')
    const criteria = new MockSearchCriteria('sun', [], 0)

    const result = strategy.calculate(
      crag as unknown as Crag,
      criteria as unknown as SearchCriteria,
    )

    expect(result.score).toBe(0)
  })

  test('should give 0 for shade preference with no summer seasonality', () => {
    const crag = new MockCrag([11, 12, 1, 2, 3], 2.5, 'sport')
    const criteria = new MockSearchCriteria('shade', [], 0)

    const result = strategy.calculate(
      crag as unknown as Crag,
      criteria as unknown as SearchCriteria,
    )

    expect(result.score).toBe(0)
  })

  test('should give MAX_SCORE/2 for any preference', () => {
    const crag = new MockCrag([5, 6, 7, 8, 9], 2.5, 'sport')
    const criteria = new MockSearchCriteria('any', [], 0)

    const result = strategy.calculate(
      crag as unknown as Crag,
      criteria as unknown as SearchCriteria,
    )

    expect(result.score).toBe(MAX_SCORE / 2)
  })
})

describe('QualityScoringStrategy', () => {
  const strategy = new QualityScoringStrategy()
  const MAX_SCORE = 3 // Using 0-3 scale

  test('should give MAX_SCORE for 3-star crag', () => {
    const crag = new MockCrag([], 3, 'sport')
    const criteria = new MockSearchCriteria('any', [], 0)

    const result = strategy.calculate(
      crag as unknown as Crag,
      criteria as unknown as SearchCriteria,
    )

    expect(result.score).toBe(MAX_SCORE)
  })

  test('should give proportional score for 2-star crag', () => {
    const crag = new MockCrag([], 2, 'sport')
    const criteria = new MockSearchCriteria('any', [], 0)

    const result = strategy.calculate(
      crag as unknown as Crag,
      criteria as unknown as SearchCriteria,
    )

    expect(result.score).toBe(2)
  })

  test('should give 0 for crag below min quality', () => {
    const crag = new MockCrag([], 1, 'sport')
    const criteria = new MockSearchCriteria('any', [], 2)

    const result = strategy.calculate(
      crag as unknown as Crag,
      criteria as unknown as SearchCriteria,
    )

    expect(result.score).toBe(0)
  })

  test('should give score when above min quality', () => {
    const crag = new MockCrag([], 2.5, 'sport')
    const criteria = new MockSearchCriteria('any', [], 2)

    const result = strategy.calculate(
      crag as unknown as Crag,
      criteria as unknown as SearchCriteria,
    )

    expect(result.score).toBe(2.5)
  })
})

describe('StyleScoringStrategy', () => {
  const strategy = new StyleScoringStrategy()
  const MAX_SCORE = 3 // Using 0-3 scale

  test('should give MAX_SCORE when primary style matches preferred styles', () => {
    const crag = new MockCrag([], 2.5, 'sport')
    const criteria = new MockSearchCriteria('any', ['sport', 'trad'], 0)

    const result = strategy.calculate(
      crag as unknown as Crag,
      criteria as unknown as SearchCriteria,
    )

    expect(result.score).toBe(MAX_SCORE)
  })

  test('should give 0 when primary style does not match preferred styles', () => {
    const crag = new MockCrag([], 2.5, 'boulder')
    const criteria = new MockSearchCriteria('any', ['sport', 'trad'], 0)

    const result = strategy.calculate(
      crag as unknown as Crag,
      criteria as unknown as SearchCriteria,
    )

    expect(result.score).toBe(0)
  })

  test('should give MAX_SCORE/2 when no preferred styles specified', () => {
    const crag = new MockCrag([], 2.5, 'sport')
    const criteria = new MockSearchCriteria('any', [], 0)

    const result = strategy.calculate(
      crag as unknown as Crag,
      criteria as unknown as SearchCriteria,
    )

    expect(result.score).toBe(MAX_SCORE / 2)
  })
})
