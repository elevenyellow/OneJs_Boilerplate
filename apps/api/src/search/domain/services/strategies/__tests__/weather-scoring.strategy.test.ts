import { describe, expect, test } from 'bun:test'
import { WeatherScoringStrategy } from '../weather-scoring.strategy'
import type { Crag } from '@crags/domain/entities/crag.entity'
import type { SearchCriteria } from '../../../value-objects/search-criteria.vo'
import type { ClimbingConditionsScorePrimitives } from '@weather'

describe('WeatherScoringStrategy', () => {
  const strategy = new WeatherScoringStrategy()

  // Create mock crag with optional aspect and seasonality
  const createMockCrag = (
    aspect?: string,
    seasonalityMonths?: number[],
  ): Crag => {
    return {
      getTags: () => ({
        toJSON: () => (aspect ? { aspect } : {}),
      }),
      getBeta: () => ({
        toJSON: () => ({}),
      }),
      getCoordinates: () => ({
        getLatitude: () => 40.0,
        getLongitude: () => -3.0,
      }),
      getSeasonality: () =>
        seasonalityMonths
          ? {
              hasData: () => true,
              getMonths: () => seasonalityMonths,
              isGoodMonth: (month: number) => seasonalityMonths.includes(month),
            }
          : {
              hasData: () => false,
              getMonths: () => [],
              isGoodMonth: () => false,
            },
    } as unknown as Crag
  }

  // Create mock criteria with optional weather conditions
  const createMockCriteria = (
    weatherConditions?: ClimbingConditionsScorePrimitives,
  ): SearchCriteria => {
    return {
      getWeatherConditions: () => weatherConditions,
      getCoordinates: () => ({
        getLatitude: () => 40.0,
        getLongitude: () => -3.0,
      }),
    } as unknown as SearchCriteria
  }

  describe('getName', () => {
    test('should return "weather"', () => {
      expect(strategy.getName()).toBe('weather')
    })
  })

  describe('calculate - no weather data', () => {
    test('should return neutral score (1.5) when no weather data', () => {
      const crag = createMockCrag()
      const criteria = createMockCriteria(undefined)

      const result = strategy.calculate(crag, criteria)

      expect(result.score).toBe(1.5)
      expect(result.details?.reason).toBe('no_weather_data')
    })
  })

  describe('calculate - with weather data', () => {
    test('should return high score for excellent conditions', () => {
      const crag = createMockCrag()
      const criteria = createMockCriteria({
        overallScore: 2.8,
        temperatureScore: 2.9,
        windScore: 3.0,
        precipitationScore: 3.0,
        humidityScore: 2.5,
        label: 'excellent',
        recommendation: 'Great conditions!',
        isClimbable: true,
      })

      const result = strategy.calculate(crag, criteria)

      expect(result.score).toBeGreaterThanOrEqual(2.5)
      expect(result.details?.isClimbable).toBe(true)
      expect(result.details?.label).toBe('excellent')
    })

    test('should return low score for poor conditions', () => {
      const crag = createMockCrag()
      const criteria = createMockCriteria({
        overallScore: 0.8,
        temperatureScore: 1.0,
        windScore: 0.5,
        precipitationScore: 0.8,
        humidityScore: 1.5,
        label: 'poor',
        recommendation: 'Not recommended',
        isClimbable: false,
      })

      const result = strategy.calculate(crag, criteria)

      expect(result.score).toBeLessThanOrEqual(0.5)
      expect(result.details?.isClimbable).toBe(false)
    })

    test('should cap score at 0.5 when not climbable', () => {
      const crag = createMockCrag()
      const criteria = createMockCriteria({
        overallScore: 2.0,
        temperatureScore: 2.0,
        windScore: 0.3, // Too windy
        precipitationScore: 2.0,
        humidityScore: 2.0,
        label: 'moderate',
        recommendation: 'Wind is too strong',
        isClimbable: false,
      })

      const result = strategy.calculate(crag, criteria)

      expect(result.score).toBeLessThanOrEqual(0.5)
    })
  })

  describe('calculate - aspect adjustments', () => {
    test('should boost north-facing crag in hot conditions needing shade', () => {
      const cragNorth = createMockCrag('N')
      const cragSouth = createMockCrag('S')

      // Hot conditions where shade is beneficial
      const criteria = createMockCriteria({
        overallScore: 1.8,
        temperatureScore: 1.2, // Temperature score low = hot
        windScore: 2.5,
        precipitationScore: 3.0,
        humidityScore: 2.0,
        label: 'moderate',
        recommendation: '',
        isClimbable: true,
      })

      const resultNorth = strategy.calculate(cragNorth, criteria)
      const resultSouth = strategy.calculate(cragSouth, criteria)

      expect(resultNorth.score).toBeGreaterThan(resultSouth.score)
      expect(resultNorth.details?.aspectAdjustment).toBeGreaterThan(0)
    })

    test('should boost south-facing crag when sun is beneficial', () => {
      const cragNorth = createMockCrag('N')
      const cragSouth = createMockCrag('S')

      // Conditions where sun is beneficial
      const criteria = createMockCriteria({
        overallScore: 2.0,
        temperatureScore: 2.5, // Good temp score
        windScore: 2.5,
        precipitationScore: 3.0,
        humidityScore: 2.0,
        label: 'good',
        recommendation: '',
        isClimbable: true,
      })

      const resultNorth = strategy.calculate(cragNorth, criteria)
      const resultSouth = strategy.calculate(cragSouth, criteria)

      expect(resultSouth.score).toBeGreaterThan(resultNorth.score)
    })

    test('should not apply adjustment when crag has no aspect', () => {
      const crag = createMockCrag() // No aspect

      const criteria = createMockCriteria({
        overallScore: 2.5,
        temperatureScore: 2.5,
        windScore: 2.5,
        precipitationScore: 2.5,
        humidityScore: 2.5,
        label: 'good',
        recommendation: '',
        isClimbable: true,
      })

      const result = strategy.calculate(crag, criteria)

      expect(result.details?.aspectAdjustment).toBe(0)
    })
  })

  describe('limiting factor detection', () => {
    test('should identify wind as limiting factor', () => {
      const crag = createMockCrag()
      const criteria = createMockCriteria({
        overallScore: 1.5,
        temperatureScore: 2.5,
        windScore: 0.8, // Limiting factor
        precipitationScore: 2.5,
        humidityScore: 2.5,
        label: 'moderate',
        recommendation: '',
        isClimbable: true,
      })

      const result = strategy.calculate(crag, criteria)

      expect(result.details?.limitingFactor).toBe('wind')
    })

    test('should identify precipitation as limiting factor', () => {
      const crag = createMockCrag()
      const criteria = createMockCriteria({
        overallScore: 1.5,
        temperatureScore: 2.5,
        windScore: 2.5,
        precipitationScore: 0.5, // Limiting factor
        humidityScore: 2.5,
        label: 'moderate',
        recommendation: '',
        isClimbable: true,
      })

      const result = strategy.calculate(crag, criteria)

      expect(result.details?.limitingFactor).toBe('precipitation')
    })

    test('should return null when no limiting factor', () => {
      const crag = createMockCrag()
      const criteria = createMockCriteria({
        overallScore: 2.8,
        temperatureScore: 2.8,
        windScore: 2.8,
        precipitationScore: 2.8,
        humidityScore: 2.8,
        label: 'excellent',
        recommendation: '',
        isClimbable: true,
      })

      const result = strategy.calculate(crag, criteria)

      expect(result.details?.limitingFactor).toBeNull()
    })
  })

  describe('seasonality adjustments', () => {
    test('should penalize winter crag when temperature is too warm in winter month', () => {
      // Winter crag: good in Nov-Mar (11, 12, 1, 2, 3)
      const winterCrag = createMockCrag(undefined, [11, 12, 1, 2, 3])

      // Mock current date to be in January (month 1)
      const originalDate = Date
      globalThis.Date = class extends originalDate {
        constructor() {
          super()
          return new originalDate('2024-01-15T12:00:00Z') // January 15
        }
        static now() {
          return new originalDate('2024-01-15T12:00:00Z').getTime()
        }
        getMonth() {
          return 0 // January (0-indexed)
        }
      } as DateConstructor

      // Warm conditions in winter (20°C) - temperatureScore will be high
      const criteria = createMockCriteria({
        overallScore: 2.5,
        temperatureScore: 2.8, // Comfortable temp = too warm for winter crag
        windScore: 2.5,
        precipitationScore: 3.0,
        humidityScore: 2.0,
        label: 'good',
        recommendation: '',
        isClimbable: true,
      })

      const result = strategy.calculate(winterCrag, criteria)

      // Should apply penalty for temperature mismatch
      expect(result.details?.seasonalityAdjustment).toBeLessThan(0)
      expect(result.score).toBeLessThan(2.5) // Score reduced from baseScore

      // Restore Date
      globalThis.Date = originalDate
    })

    test('should not penalize winter crag when temperature is cold in winter month', () => {
      // Winter crag: good in Nov-Mar (11, 12, 1, 2, 3)
      const winterCrag = createMockCrag(undefined, [11, 12, 1, 2, 3])

      // Mock current date to be in January (month 1)
      const originalDate = Date
      globalThis.Date = class extends originalDate {
        constructor() {
          super()
          return new originalDate('2024-01-15T12:00:00Z')
        }
        static now() {
          return new originalDate('2024-01-15T12:00:00Z').getTime()
        }
        getMonth() {
          return 0 // January
        }
      } as DateConstructor

      // Cold conditions in winter (8°C) - temperatureScore will be lower
      const criteria = createMockCriteria({
        overallScore: 2.0,
        temperatureScore: 2.0, // Moderate temp score = expected for winter
        windScore: 2.5,
        precipitationScore: 3.0,
        humidityScore: 2.0,
        label: 'good',
        recommendation: '',
        isClimbable: true,
      })

      const result = strategy.calculate(winterCrag, criteria)

      // Should NOT apply penalty
      expect(result.details?.seasonalityAdjustment).toBe(0)

      // Restore Date
      globalThis.Date = originalDate
    })

    test('should penalize summer crag when temperature is too cold in summer month', () => {
      // Summer crag: good in Apr-Oct (4, 5, 6, 7, 8, 9, 10)
      const summerCrag = createMockCrag(undefined, [4, 5, 6, 7, 8, 9, 10])

      // Mock current date to be in July (month 7)
      const originalDate = Date
      globalThis.Date = class extends originalDate {
        constructor() {
          super()
          return new originalDate('2024-07-15T12:00:00Z')
        }
        static now() {
          return new originalDate('2024-07-15T12:00:00Z').getTime()
        }
        getMonth() {
          return 6 // July (0-indexed)
        }
      } as DateConstructor

      // Cold conditions in summer (10°C) - temperatureScore will be low
      const criteria = createMockCriteria({
        overallScore: 1.8,
        temperatureScore: 1.2, // Low temp score = too cold for summer crag
        windScore: 2.5,
        precipitationScore: 3.0,
        humidityScore: 2.0,
        label: 'moderate',
        recommendation: '',
        isClimbable: true,
      })

      const result = strategy.calculate(summerCrag, criteria)

      // Should apply penalty for temperature mismatch
      expect(result.details?.seasonalityAdjustment).toBeLessThan(0)
      expect(result.score).toBeLessThan(1.8) // Score reduced from baseScore

      // Restore Date
      globalThis.Date = originalDate
    })

    test('should not apply adjustment when current month is not in good months', () => {
      // Winter crag: good in Nov-Mar (11, 12, 1, 2, 3)
      const winterCrag = createMockCrag(undefined, [11, 12, 1, 2, 3])

      // Mock current date to be in July (not a good month for winter crag)
      const originalDate = Date
      globalThis.Date = class extends originalDate {
        constructor() {
          super()
          return new originalDate('2024-07-15T12:00:00Z')
        }
        static now() {
          return new originalDate('2024-07-15T12:00:00Z').getTime()
        }
        getMonth() {
          return 6 // July
        }
      } as DateConstructor

      const criteria = createMockCriteria({
        overallScore: 2.5,
        temperatureScore: 2.8,
        windScore: 2.5,
        precipitationScore: 3.0,
        humidityScore: 2.0,
        label: 'good',
        recommendation: '',
        isClimbable: true,
      })

      const result = strategy.calculate(winterCrag, criteria)

      // Should NOT apply adjustment (not in good months)
      expect(result.details?.seasonalityAdjustment).toBe(0)

      // Restore Date
      globalThis.Date = originalDate
    })

    test('should not apply adjustment when crag has no seasonality data', () => {
      const cragNoSeasonality = createMockCrag() // No seasonality

      const criteria = createMockCriteria({
        overallScore: 2.5,
        temperatureScore: 2.8,
        windScore: 2.5,
        precipitationScore: 3.0,
        humidityScore: 2.0,
        label: 'good',
        recommendation: '',
        isClimbable: true,
      })

      const result = strategy.calculate(cragNoSeasonality, criteria)

      // Should NOT apply adjustment (no seasonality data)
      expect(result.details?.seasonalityAdjustment).toBe(0)
    })
  })
})
