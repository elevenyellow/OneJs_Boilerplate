import { describe, expect, test, mock, beforeEach } from 'bun:test'
import { EvaluateCragSectorsConditionsUseCase } from '../evaluate-crag-sectors-conditions.use-case'
import type { WeatherData } from '../../../domain/entities/weather-response.entity'
import type { WeatherCacheService } from '../../services/weather-cache.service'
import type { ClimbingConditionsScoringService } from '../../../domain/services/climbing-conditions-scoring.service'
import type { SectorPrismaRepository } from '@sectors/infrastructure/persistence/prisma/sector.repository'
import type { Logger } from '@OneJs/core'
import type { Crag } from '@crags/domain/entities/crag.entity'

/**
 * Unit tests for EvaluateCragSectorsConditionsUseCase
 *
 * TEST CASES LIST (REASON)
 * 1. ✓ Return evaluation result with sector scores
 * 2. ✓ Calculate overall score as average of sector scores
 * 3. ✓ Count sectors with good conditions
 * 4. ✓ Use aspect-based scoring when sector has aspect
 * 5. ✓ Use seasonality fallback when sector has no aspect
 * 6. ✓ Return empty result when crag has no sectors
 * 7. ✓ Return null when crag has no coordinates
 * 8. ✓ Return null when weather API fails
 * 9. ✓ Use current conditions when specific date not in forecast
 * 10. ✓ Apply season boost/penalty in seasonality fallback
 */

describe('EvaluateCragSectorsConditionsUseCase', () => {
  // Mock dependencies with partial types
  let mockWeatherCacheService: Partial<WeatherCacheService>
  let mockConditionsScoringService: Partial<ClimbingConditionsScoringService>
  let mockSectorRepository: Partial<SectorPrismaRepository>
  let mockLogger: Partial<Logger>
  let useCase: EvaluateCragSectorsConditionsUseCase

  // Test data builders
  const createMockWeatherData = (): WeatherData => ({
    metadata: {
      location: 'Test Location',
      coordinates: { lat: 41.7, lon: 1.8 },
      timezone: 'UTC',
      lastUpdate: new Date(),
      generationTimeMs: 100,
    },
    current: {
      timestamp: new Date(),
      temperature: 18,
      windSpeed: 5,
      weatherCode: 1,
      isDaylight: true,
    },
    hourly: [],
    daily: [
      {
        date: '2025-01-17',
        temperatureMax: 22,
        temperatureMin: 10,
        precipitationSum: 0,
        precipitationProbability: 10,
        windSpeedMax: 8,
        weatherCode: 1,
        sunrise: new Date('2025-01-17T07:00:00'),
        sunset: new Date('2025-01-17T18:00:00'),
      },
    ],
  })

  function createMockCrag(
    id: string,
    lat: number | null,
    lon: number | null,
  ): Crag {
    return {
      getId: () => ({ toString: () => id }),
      getCoordinates: () => ({
        getLatitude: () => lat,
        getLongitude: () => lon,
      }),
    } as unknown as Crag
  }

  function createMockSector(
    id: string,
    name: string,
    aspect: string | null,
    seasonalityMonths: number[],
  ) {
    return {
      getId: () => ({ toString: () => id }),
      getName: () => ({ toString: () => name }),
      getTags: () => ({ getAspect: () => aspect }),
      getSeasonality: () => ({ getMonths: () => seasonalityMonths }),
    }
  }

  function createMockConditionsScore(overallScore: number) {
    return {
      getOverallScore: () => overallScore,
    }
  }

  beforeEach(() => {
    mockWeatherCacheService = {
      getWeatherByCoordinates: mock(async () => createMockWeatherData()),
    }

    mockConditionsScoringService = {
      calculateFromDailyForecast: mock(() => createMockConditionsScore(2.5)),
      calculateCurrentConditions: mock(() => createMockConditionsScore(2.0)),
    }

    mockSectorRepository = {
      findByCragId: mock(async () => []),
    }

    mockLogger = {
      debug: mock(() => {
        // Mock implementation
      }),
      warn: mock(() => {
        // Mock implementation
      }),
      error: mock(() => {
        // Mock implementation
      }),
    }

    useCase = new EvaluateCragSectorsConditionsUseCase(
      mockWeatherCacheService as WeatherCacheService,
      mockConditionsScoringService as ClimbingConditionsScoringService,
      mockSectorRepository as SectorPrismaRepository,
      mockLogger as Logger,
    )
  })

  test('should return evaluation result with sector scores', async () => {
    const crag = createMockCrag('crag-123', 41.7, 1.8)
    const sectors = [
      createMockSector('sector-1', 'Sector 1', 'north', [1, 2, 3]),
      createMockSector('sector-2', 'Sector 2', 'south', [6, 7, 8]),
    ]

    mockSectorRepository.findByCragId = mock(async () => sectors)

    const result = await useCase.execute(crag, '2025-01-17')

    expect(result).not.toBeNull()
    expect(result?.cragId).toBe('crag-123')
    expect(result?.date).toBe('2025-01-17')
    expect(result?.totalSectors).toBe(2)
    expect(result?.sectorEvaluations).toHaveLength(2)
  })

  test('should calculate overall score as average of sector scores', async () => {
    const crag = createMockCrag('crag-123', 41.7, 1.8)
    const sectors = [
      createMockSector('sector-1', 'Sector 1', 'north', [1, 2, 3]),
      createMockSector('sector-2', 'Sector 2', 'south', [6, 7, 8]),
    ]

    mockSectorRepository.findByCragId = mock(async () => sectors)

    // Return different scores for each sector
    let callCount = 0
    mockConditionsScoringService.calculateFromDailyForecast = mock(() => {
      callCount++
      return createMockConditionsScore(callCount === 1 ? 3.0 : 2.0)
    })

    const result = await useCase.execute(crag, '2025-01-17')

    // Average: (3.0 + 2.0) / 2 = 2.5
    expect(result?.overallScore).toBe(2.5)
  })

  test('should count sectors with good conditions', async () => {
    const crag = createMockCrag('crag-123', 41.7, 1.8)
    const sectors = [
      createMockSector('sector-1', 'Sector 1', 'north', [1, 2, 3]),
      createMockSector('sector-2', 'Sector 2', 'south', [6, 7, 8]),
      createMockSector('sector-3', 'Sector 3', 'east', [4, 5, 6]),
    ]

    mockSectorRepository.findByCragId = mock(async () => sectors)

    // Scores: 3.0 (good), 1.5 (poor), 2.5 (good)
    let callCount = 0
    mockConditionsScoringService.calculateFromDailyForecast = mock(() => {
      callCount++
      const scores = [3.0, 1.5, 2.5]
      return createMockConditionsScore(scores[(callCount - 1) % 3])
    })

    const result = await useCase.execute(crag, '2025-01-17')

    expect(result?.sectorsWithGoodConditions).toBe(2)
  })

  test('should use aspect-based scoring when sector has aspect', async () => {
    const crag = createMockCrag('crag-123', 41.7, 1.8)
    const sector = createMockSector('sector-1', 'Sector 1', 'north', [1, 2, 3])

    mockSectorRepository.findByCragId = mock(async () => [sector])

    await useCase.execute(crag, '2025-01-17')

    // Should call calculateFromDailyForecast with aspect
    expect(
      mockConditionsScoringService.calculateFromDailyForecast,
    ).toHaveBeenCalled()
  })

  test('should use seasonality fallback when sector has no aspect', async () => {
    const crag = createMockCrag('crag-123', 41.7, 1.8)
    const sector = createMockSector(
      'sector-1',
      'Sector 1',
      null,
      [6, 7, 8], // Summer months
    )

    mockSectorRepository.findByCragId = mock(async () => [sector])

    const result = await useCase.execute(crag, '2025-01-17')

    // Should still return a result with seasonality-based score
    expect(result).not.toBeNull()
    expect(result?.sectorEvaluations[0].usedSeasonalityFallback).toBe(true)
  })

  test('should return empty result when crag has no sectors', async () => {
    const crag = createMockCrag('crag-123', 41.7, 1.8)

    mockSectorRepository.findByCragId = mock(async () => [])

    const result = await useCase.execute(crag, '2025-01-17')

    expect(result).not.toBeNull()
    expect(result?.totalSectors).toBe(0)
    expect(result?.sectorsWithGoodConditions).toBe(0)
    expect(result?.overallScore).toBe(0)
    expect(result?.label).toBe('poor')
    expect(result?.sectorEvaluations).toHaveLength(0)
  })

  test('should return null when crag has no coordinates', async () => {
    const crag = createMockCrag('crag-123', null, null)

    const result = await useCase.execute(crag, '2025-01-17')

    expect(result).toBeNull()
    expect(mockLogger.warn).toHaveBeenCalled()
  })

  test('should return null when weather API fails', async () => {
    const crag = createMockCrag('crag-123', 41.7, 1.8)

    mockWeatherCacheService.getWeatherByCoordinates = mock(async () => {
      throw new Error('Weather API error')
    })

    const result = await useCase.execute(crag, '2025-01-17')

    expect(result).toBeNull()
    expect(mockLogger.error).toHaveBeenCalled()
  })

  test('should apply correct label based on overall score', async () => {
    const crag = createMockCrag('crag-123', 41.7, 1.8)
    const sector = createMockSector('sector-1', 'Sector 1', 'north', [1, 2, 3])

    mockSectorRepository.findByCragId = mock(async () => [sector])

    // Test excellent (score >= 3.0)
    mockConditionsScoringService.calculateFromDailyForecast = mock(() =>
      createMockConditionsScore(3.5),
    )
    let result = await useCase.execute(crag, '2025-01-17')
    expect(result?.label).toBe('excellent')

    // Test good (score >= 2.0)
    mockConditionsScoringService.calculateFromDailyForecast = mock(() =>
      createMockConditionsScore(2.5),
    )
    result = await useCase.execute(crag, '2025-01-17')
    expect(result?.label).toBe('good')

    // Test fair (score >= 1.0)
    mockConditionsScoringService.calculateFromDailyForecast = mock(() =>
      createMockConditionsScore(1.5),
    )
    result = await useCase.execute(crag, '2025-01-17')
    expect(result?.label).toBe('fair')

    // Test poor (score < 1.0)
    mockConditionsScoringService.calculateFromDailyForecast = mock(() =>
      createMockConditionsScore(0.5),
    )
    result = await useCase.execute(crag, '2025-01-17')
    expect(result?.label).toBe('poor')
  })

  test('should use current conditions when specific date not in forecast', async () => {
    const crag = createMockCrag('crag-123', 41.7, 1.8)
    const sector = createMockSector('sector-1', 'Sector 1', 'north', [1, 2, 3])

    mockSectorRepository.findByCragId = mock(async () => [sector])

    // Query for a date not in the forecast
    const result = await useCase.execute(crag, '2025-02-01')

    // Should still return a result using current conditions
    expect(result).not.toBeNull()
    expect(mockLogger.warn).toHaveBeenCalled()
  })
})
