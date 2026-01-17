import { Inject, Injectable, Logger } from '@OneJs/core'
import type { Crag } from '@crags/domain/entities/crag.entity'
import type { Sector } from '@sectors/domain/entities/sector.entity'
import { SectorPrismaRepository } from '@sectors/infrastructure/persistence/prisma/sector.repository'
import type { AspectDirection } from '@sectors/domain/value-objects/sector-tags.vo'
import { ClimbingConditionsScoringService } from '../../domain/services/climbing-conditions-scoring.service'
import type { Season } from '../../domain/value-objects/temperature-score.vo'
import { WeatherCacheService } from '../services/weather-cache.service'

/**
 * Result of evaluating a single sector's conditions
 */
export interface SectorConditionEvaluation {
  sectorId: string
  sectorName: string
  score: number
  hasGoodConditions: boolean
  aspect: AspectDirection | null
  usedSeasonalityFallback: boolean
}

/**
 * Result of evaluating all sectors in a crag
 */
export interface CragSectorsConditionsResult {
  cragId: string
  date: string
  totalSectors: number
  sectorsWithGoodConditions: number
  overallScore: number
  label: 'excellent' | 'good' | 'fair' | 'poor'
  sectorEvaluations: SectorConditionEvaluation[]
}

/**
 * Threshold for "good" climbing conditions (score range 0-4)
 */
const GOOD_CONDITIONS_THRESHOLD = 2.0

/**
 * Use case for evaluating climbing conditions for all sectors in a crag.
 *
 * The evaluation considers:
 * 1. Weather data at the crag coordinates
 * 2. Each sector's orientation (aspect) for sun/shade adjustments
 * 3. Fallback to sector seasonality when aspect is not available
 *
 * Results are aggregated to provide:
 * - Overall crag score
 * - Count of sectors with good conditions
 * - Per-sector evaluation details
 */
@Injectable()
export class EvaluateCragSectorsConditionsUseCase {
  constructor(
    @Inject(WeatherCacheService)
    private readonly weatherCacheService: WeatherCacheService,

    @Inject(ClimbingConditionsScoringService)
    private readonly conditionsScoringService: ClimbingConditionsScoringService,

    @Inject(SectorPrismaRepository)
    private readonly sectorRepository: SectorPrismaRepository,

    @Inject(Logger)
    private readonly logger: Logger,
  ) {}

  /**
   * Execute the evaluation for a crag on a specific date
   *
   * @param crag The crag to evaluate
   * @param queryDate ISO date string (e.g., "2025-01-17")
   * @returns Evaluation result or null if weather data unavailable
   */
  async execute(
    crag: Crag,
    queryDate: string,
  ): Promise<CragSectorsConditionsResult | null> {
    const cragId = crag.getId().toString()
    const coordinates = crag.getCoordinates()

    const lat = coordinates.getLatitude()
    const lon = coordinates.getLongitude()

    if (lat === null || lon === null) {
      this.logger.warn(
        'weather:evaluate-sectors',
        `Crag ${cragId} has no coordinates, cannot evaluate weather`,
      )
      return null
    }

    try {
      // 1. Fetch weather data for crag coordinates
      const weatherData =
        await this.weatherCacheService.getWeatherByCoordinates(lat, lon)

      // 2. Get the daily forecast for the query date
      const dailyForecast = weatherData.daily.find((day) =>
        day.date.startsWith(queryDate),
      )

      if (!dailyForecast) {
        this.logger.warn(
          'weather:evaluate-sectors',
          `No forecast data for date ${queryDate} at crag ${cragId}`,
        )
        // Fall back to current conditions if specific date not available
      }

      // 3. Get all sectors for the crag
      const sectors = await this.sectorRepository.findByCragId(crag.getId())

      if (sectors.length === 0) {
        this.logger.debug(
          'weather:evaluate-sectors',
          `Crag ${cragId} has no sectors`,
        )
        return this.createEmptyResult(cragId, queryDate)
      }

      // 4. Determine current season
      const season = this.getSeasonFromDate(queryDate)

      // 5. Evaluate each sector
      const sectorEvaluations = sectors.map((sector) =>
        this.evaluateSector(sector, weatherData, dailyForecast, season),
      )

      // 6. Aggregate results
      const sectorsWithGoodConditions = sectorEvaluations.filter(
        (e) => e.hasGoodConditions,
      ).length

      const overallScore =
        sectorEvaluations.reduce((sum, e) => sum + e.score, 0) /
        sectorEvaluations.length

      const label = this.getLabel(overallScore)

      this.logger.debug(
        'weather:evaluate-sectors',
        `Evaluated ${sectors.length} sectors for crag ${cragId}: ${sectorsWithGoodConditions} with good conditions`,
      )

      return {
        cragId,
        date: queryDate,
        totalSectors: sectors.length,
        sectorsWithGoodConditions,
        overallScore,
        label,
        sectorEvaluations,
      }
    } catch (error) {
      this.logger.error(
        'weather:evaluate-sectors',
        `Failed to evaluate sectors for crag ${cragId}`,
        { error },
      )
      return null
    }
  }

  /**
   * Evaluate a single sector's climbing conditions
   */
  private evaluateSector(
    sector: Sector,
    weatherData: import('../../domain/entities/weather-response.entity').WeatherData,
    dailyForecast:
      | import('../../domain/entities/weather-response.entity').DailyForecast
      | undefined,
    season: Season,
  ): SectorConditionEvaluation {
    const sectorId = sector.getId().toString()
    const sectorName = sector.getName().toString()
    const aspect = sector.getTags().getAspect()

    let score: number
    let usedSeasonalityFallback = false

    if (aspect) {
      // Primary: Use aspect-aware scoring
      const conditions = dailyForecast
        ? this.conditionsScoringService.calculateFromDailyForecast(
            dailyForecast,
            aspect,
            season,
          )
        : this.conditionsScoringService.calculateCurrentConditions(
            weatherData.current,
            weatherData.daily[0] ?? null,
            aspect,
            season,
          )

      score = conditions.getOverallScore()
    } else {
      // Fallback: Use seasonality to determine if conditions are suitable
      const seasonality = sector.getSeasonality()
      const currentMonth = this.getCurrentMonthFromSeason(season)

      // Check if current month is in sector's good months
      const isGoodSeason = seasonality.getMonths().includes(currentMonth)

      // Calculate base conditions without aspect
      const baseConditions = dailyForecast
        ? this.conditionsScoringService.calculateFromDailyForecast(
            dailyForecast,
            null,
            season,
          )
        : this.conditionsScoringService.calculateCurrentConditions(
            weatherData.current,
            weatherData.daily[0] ?? null,
            null,
            season,
          )

      // Adjust score based on seasonality
      score = isGoodSeason
        ? baseConditions.getOverallScore() * 1.1 // Boost if in season
        : baseConditions.getOverallScore() * 0.9 // Reduce if out of season

      // Cap score at max 4.0
      score = Math.min(score, 4.0)
      usedSeasonalityFallback = true
    }

    return {
      sectorId,
      sectorName,
      score,
      hasGoodConditions: score >= GOOD_CONDITIONS_THRESHOLD,
      aspect,
      usedSeasonalityFallback,
    }
  }

  /**
   * Create an empty result for crags with no sectors
   */
  private createEmptyResult(
    cragId: string,
    queryDate: string,
  ): CragSectorsConditionsResult {
    return {
      cragId,
      date: queryDate,
      totalSectors: 0,
      sectorsWithGoodConditions: 0,
      overallScore: 0,
      label: 'poor',
      sectorEvaluations: [],
    }
  }

  /**
   * Determine season from date
   */
  private getSeasonFromDate(dateString: string): Season {
    const date = new Date(dateString)
    const month = date.getMonth() + 1 // 1-12

    if (month >= 3 && month <= 5) return 'spring'
    if (month >= 6 && month <= 8) return 'summer'
    if (month >= 9 && month <= 11) return 'autumn'
    return 'winter'
  }

  /**
   * Get representative month number for a season (for seasonality lookup)
   */
  private getCurrentMonthFromSeason(season: Season): number {
    switch (season) {
      case 'spring':
        return 4 // April
      case 'summer':
        return 7 // July
      case 'autumn':
        return 10 // October
      case 'winter':
        return 1 // January
    }
  }

  /**
   * Get condition label from score
   */
  private getLabel(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 3.0) return 'excellent'
    if (score >= 2.0) return 'good'
    if (score >= 1.0) return 'fair'
    return 'poor'
  }
}
