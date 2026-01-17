import { Inject, Injectable, Logger } from '@OneJs/core'
import { WeatherCacheService, ClimbingConditionsScoringService } from '@weather'
import { EvaluateCragSectorsConditionsUseCase } from '@weather/application/use-cases/evaluate-crag-sectors-conditions.use-case'
import type { Crag } from '@crags/domain/entities/crag.entity'
import { SearchCragRepository } from '../../infrastructure/persistence/search-crag.repository'
import { CragScoringService } from '../../domain/services/crag-scoring.service'
import { DistanceScoringStrategy } from '../../domain/services/strategies/distance-scoring.strategy'
import { GradeMatchScoringStrategy } from '../../domain/services/strategies/grade-match-scoring.strategy'
import { RouteCountScoringStrategy } from '../../domain/services/strategies/route-count-scoring.strategy'
import { SeasonalityScoringStrategy } from '../../domain/services/strategies/seasonality-scoring.strategy'
import { ExposureScoringStrategy } from '../../domain/services/strategies/exposure-scoring.strategy'
import { QualityScoringStrategy } from '../../domain/services/strategies/quality-scoring.strategy'
import { StyleScoringStrategy } from '../../domain/services/strategies/style-scoring.strategy'
import { WeatherScoringStrategy } from '../../domain/services/strategies/weather-scoring.strategy'
import type { SearchCriteria } from '../../domain/value-objects/search-criteria.vo'
import type { IncludeWeather } from '../../domain/value-objects/include-weather.vo'
import type { QueryDate } from '../../domain/value-objects/query-date.vo'
import {
  ScoredCragResult,
  type ScoreBreakdown,
} from '../../domain/value-objects/scored-crag-result.vo'
import { CragWeatherEvaluation } from '../../domain/value-objects/crag-weather-evaluation.vo'
import type { ICragScoreCache } from '../../domain/ports/crag-score-cache.port'
import { InMemoryCragScoreCache } from '../../infrastructure/cache/in-memory-crag-score-cache'

/**
 * Default weights for scoring strategies
 * Total: 1.0
 */
const DEFAULT_WEIGHTS = {
  distance: 0.25,
  gradeMatch: 0.2,
  seasonality: 0.1,
  weather: 0.15,
  routeCount: 0.1,
  exposure: 0.1,
  quality: 0.07,
  style: 0.03,
}

/**
 * Weights for combining cached static scores with dynamic scores
 */
const SCORE_COMBINATION_WEIGHTS = {
  grade: 0.25,
  quality: 0.2,
  styles: 0.15,
  distance: 0.25,
  weather: 0.15,
}

/**
 * Neutral weather score when no evaluation available
 */
const NEUTRAL_WEATHER_SCORE = 0.5

@Injectable()
export class SearchCragsWithScoringUseCase {
  private readonly scoringService: CragScoringService

  constructor(
    @Inject(SearchCragRepository)
    private readonly cragRepository: SearchCragRepository,

    @Inject(WeatherCacheService)
    private readonly weatherCacheService: WeatherCacheService,

    @Inject(ClimbingConditionsScoringService)
    private readonly conditionsScoringService: ClimbingConditionsScoringService,

    @Inject(EvaluateCragSectorsConditionsUseCase)
    private readonly evaluateCragSectorsUseCase: EvaluateCragSectorsConditionsUseCase,

    @Inject(InMemoryCragScoreCache)
    private readonly scoreCache: ICragScoreCache,

    @Inject(Logger)
    private readonly logger: Logger,
  ) {
    this.scoringService = new CragScoringService([
      {
        strategy: new DistanceScoringStrategy(),
        weight: DEFAULT_WEIGHTS.distance,
      },
      {
        strategy: new GradeMatchScoringStrategy(),
        weight: DEFAULT_WEIGHTS.gradeMatch,
      },
      {
        strategy: new SeasonalityScoringStrategy(),
        weight: DEFAULT_WEIGHTS.seasonality,
      },
      {
        strategy: new WeatherScoringStrategy(),
        weight: DEFAULT_WEIGHTS.weather,
      },
      {
        strategy: new RouteCountScoringStrategy(),
        weight: DEFAULT_WEIGHTS.routeCount,
      },
      {
        strategy: new ExposureScoringStrategy(),
        weight: DEFAULT_WEIGHTS.exposure,
      },
      {
        strategy: new QualityScoringStrategy(),
        weight: DEFAULT_WEIGHTS.quality,
      },
      {
        strategy: new StyleScoringStrategy(),
        weight: DEFAULT_WEIGHTS.style,
      },
    ])
  }

  /**
   * Execute search with scoring
   * @param criteria - Search criteria (includes weather options)
   * @returns Array of scored crag results, ordered by score descending
   */
  async execute(criteria: SearchCriteria): Promise<ScoredCragResult[]> {
    const includeWeather = criteria.getIncludeWeather()
    const queryDate = criteria.getQueryDate()

    // Build enriched criteria with weather data if requested
    const enrichedCriteria = await this.buildEnrichedCriteria(
      criteria,
      includeWeather,
    )

    // Find crags matching criteria
    this.logger.debug('search:usecase', 'Querying repository...')

    const crags =
      await this.cragRepository.findBySearchCriteria(enrichedCriteria)

    this.logger.debug(
      'search:usecase',
      `Found ${crags.length} crags from repository`,
    )

    // Calculate scores using caching
    const scoredResults = await this.calculateScoredResultsWithCaching(
      crags,
      enrichedCriteria,
      queryDate,
      includeWeather,
    )

    // Sort by total score descending
    scoredResults.sort((a, b) => b.getTotalScore() - a.getTotalScore())

    // Apply limit
    const limit = criteria.getLimit()
    const limitValue = limit.getValue()
    this.logger.info(
      'search:usecase',
      `Returning ${Math.min(scoredResults.length, limitValue)} results (limit: ${limitValue})`,
    )
    return scoredResults.slice(0, limitValue)
  }

  /**
   * Build enriched criteria with weather data if weather inclusion is requested
   */
  private async buildEnrichedCriteria(
    criteria: SearchCriteria,
    includeWeather: IncludeWeather,
  ): Promise<SearchCriteria> {
    if (!includeWeather.getValue()) {
      return criteria
    }

    this.logger.debug('search:usecase', 'Enriching with weather data...')
    const enrichedCriteria = await this.enrichWithWeatherData(criteria)

    this.logger.debug(
      'search:usecase',
      `Weather enrichment complete. Has conditions: ${!!enrichedCriteria.getWeatherConditions()}`,
    )

    return enrichedCriteria
  }

  /**
   * Calculate scored results with caching support
   */
  private async calculateScoredResultsWithCaching(
    crags: Crag[],
    criteria: SearchCriteria,
    queryDate: QueryDate,
    includeWeather: IncludeWeather,
  ): Promise<ScoredCragResult[]> {
    // Process all crags in parallel
    const results = await Promise.all(
      crags.map((crag) =>
        this.scoreWithCache(crag, criteria, queryDate, includeWeather),
      ),
    )

    return results
  }

  /**
   * Score a single crag with caching
   */
  private async scoreWithCache(
    crag: Crag,
    criteria: SearchCriteria,
    queryDate: QueryDate,
    includeWeather: IncludeWeather,
  ): Promise<ScoredCragResult> {
    const cragId = crag.getId().toString()
    const queryDateValue = queryDate.getValue()

    // 1. Get or calculate static scores (cached for 24h)
    let staticScores = await this.scoreCache.getStaticScores(cragId)

    if (!staticScores) {
      // Calculate using scoring service
      const result = this.scoringService.calculateScore(crag, criteria)
      const breakdown = result.getScoreBreakdown()

      const scoresToCache = {
        cragId,
        gradeScore: breakdown['gradeMatch']?.weighted ?? 0,
        qualityScore: breakdown['quality']?.weighted ?? 0,
        stylesScore: breakdown['style']?.weighted ?? 0,
        routeCountScore: breakdown['routeCount']?.weighted ?? 0,
      }

      await this.scoreCache.setStaticScores(cragId, scoresToCache)

      // Assign for use below (cache adds cachedAt)
      staticScores = {
        ...scoresToCache,
        cachedAt: Date.now(),
      }
    }

    // 2. Calculate distance score (always dynamic - depends on user location)
    const distanceResult = this.scoringService.calculateScore(crag, criteria)
    const distanceKm = distanceResult.getDistanceKm()
    const distanceScore =
      distanceResult.getScoreBreakdown()['distance']?.weighted ?? 0

    // 3. Get or calculate weather evaluation (cached per date for 12h)
    let weatherEvaluation: CragWeatherEvaluation | null = null
    let weatherScore = NEUTRAL_WEATHER_SCORE

    if (includeWeather.getValue()) {
      const cachedWeather = await this.scoreCache.getWeatherEvaluation(
        cragId,
        queryDateValue,
      )

      if (cachedWeather) {
        // Use cached evaluation
        weatherEvaluation = CragWeatherEvaluation.fromPrimitives({
          cragId: cachedWeather.cragId,
          date: cachedWeather.date,
          totalSectors: cachedWeather.totalSectors,
          sectorsWithGoodConditions: cachedWeather.sectorsWithGoodConditions,
          overallScore: cachedWeather.overallScore,
          label: cachedWeather.label,
          sectorEvaluations: cachedWeather.sectorEvaluations,
        })
        weatherScore = this.normalizeWeatherScore(cachedWeather.overallScore)
      } else {
        // Evaluate weather for crag sectors
        const evalResult = await this.evaluateCragSectorsUseCase.execute(
          crag,
          queryDateValue,
        )

        if (evalResult) {
          // Create value object and cache
          const sectorEvaluations = evalResult.sectorEvaluations.map((e) =>
            CragWeatherEvaluation.createSectorEvaluation(e.sectorId, e.score),
          )

          weatherEvaluation = CragWeatherEvaluation.create({
            cragId,
            date: queryDateValue,
            sectorEvaluations,
          })

          const primitives = weatherEvaluation.toPrimitives()
          await this.scoreCache.setWeatherEvaluation(cragId, queryDateValue, {
            cragId: primitives.cragId,
            date: primitives.date,
            totalSectors: primitives.totalSectors,
            sectorsWithGoodConditions: primitives.sectorsWithGoodConditions,
            overallScore: primitives.overallScore,
            label: primitives.label,
            sectorEvaluations: primitives.sectorEvaluations,
          })

          weatherScore = this.normalizeWeatherScore(evalResult.overallScore)
        }
      }
    }

    // 4. Combine scores with weights
    const totalScore = this.combineScores({
      gradeScore: staticScores.gradeScore,
      qualityScore: staticScores.qualityScore,
      stylesScore: staticScores.stylesScore,
      distanceScore,
      weatherScore,
    })

    // 5. Build score breakdown for response
    const scoreBreakdown: ScoreBreakdown = {
      gradeMatch: {
        score: staticScores.gradeScore,
        weight: SCORE_COMBINATION_WEIGHTS.grade,
        weighted: staticScores.gradeScore * SCORE_COMBINATION_WEIGHTS.grade,
      },
      quality: {
        score: staticScores.qualityScore,
        weight: SCORE_COMBINATION_WEIGHTS.quality,
        weighted: staticScores.qualityScore * SCORE_COMBINATION_WEIGHTS.quality,
      },
      style: {
        score: staticScores.stylesScore,
        weight: SCORE_COMBINATION_WEIGHTS.styles,
        weighted: staticScores.stylesScore * SCORE_COMBINATION_WEIGHTS.styles,
      },
      distance: {
        score: distanceScore,
        weight: SCORE_COMBINATION_WEIGHTS.distance,
        weighted: distanceScore * SCORE_COMBINATION_WEIGHTS.distance,
      },
      weather: {
        score: weatherScore,
        weight: SCORE_COMBINATION_WEIGHTS.weather,
        weighted: weatherScore * SCORE_COMBINATION_WEIGHTS.weather,
      },
    }

    return ScoredCragResult.create(
      crag,
      totalScore,
      distanceKm,
      scoreBreakdown,
      weatherEvaluation,
    )
  }

  /**
   * Combine individual scores with weights
   */
  private combineScores(scores: {
    gradeScore: number
    qualityScore: number
    stylesScore: number
    distanceScore: number
    weatherScore: number
  }): number {
    return (
      scores.gradeScore * SCORE_COMBINATION_WEIGHTS.grade +
      scores.qualityScore * SCORE_COMBINATION_WEIGHTS.quality +
      scores.stylesScore * SCORE_COMBINATION_WEIGHTS.styles +
      scores.distanceScore * SCORE_COMBINATION_WEIGHTS.distance +
      scores.weatherScore * SCORE_COMBINATION_WEIGHTS.weather
    )
  }

  /**
   * Normalize weather score from 0-4 range to 0-1 range
   */
  private normalizeWeatherScore(score: number): number {
    return Math.min(1, Math.max(0, score / 4))
  }

  /**
   * Enrich search criteria with current weather conditions
   */
  private async enrichWithWeatherData(
    criteria: SearchCriteria,
  ): Promise<SearchCriteria> {
    try {
      const coords = criteria.getCoordinates()
      const lat = coords.getLatitude()
      const lon = coords.getLongitude()

      this.logger.info(
        'search:weather',
        `Fetching weather for coords: ${lat}, ${lon}`,
      )

      if (lat === null || lon === null) {
        this.logger.info('search:weather', 'No coordinates for weather fetch')
        return criteria
      }

      // Fetch weather data (cached)
      this.logger.info('search:weather', 'Calling weatherCacheService...')
      const weatherData =
        await this.weatherCacheService.getWeatherByCoordinates(lat, lon)
      this.logger.debug('search:weather', 'Weather data received')

      // Calculate climbing conditions
      this.logger.debug('search:weather', 'Calculating climbing conditions...')
      const result =
        this.conditionsScoringService.calculateFromWeatherData(weatherData)
      this.logger.debug('search:weather', 'Climbing conditions calculated')

      // Enrich criteria with weather conditions
      const weatherConditions = result.getConditions().toPrimitives()

      this.logger.debug(
        'search:weather',
        `Weather conditions: ${weatherConditions.label} (${weatherConditions.overallScore.toFixed(2)})`,
      )

      return criteria.withWeatherConditions(weatherConditions)
    } catch (error) {
      // Log error but don't fail search - weather is optional
      this.logger.error(
        'search:weather',
        `Failed to fetch weather: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
      this.logger.error(
        'search:weather',
        `Error stack: ${error instanceof Error ? error.stack : 'N/A'}`,
      )
      return criteria
    }
  }
}
