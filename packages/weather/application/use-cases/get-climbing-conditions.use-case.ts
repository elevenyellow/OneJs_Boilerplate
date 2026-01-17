import { Inject, Injectable, Logger } from '@OneJs/core'
import { ClimbingConditionsScoringService } from '../../domain/services/climbing-conditions-scoring.service'
import {
  ClimbingConditionsResult,
  type CurrentWeatherData,
} from '../../domain/value-objects/climbing-conditions-result.vo'
import { Coordinates } from '../../domain/value-objects/coordinates.vo'
import type { AspectDirection } from '../../domain/value-objects/temperature-score.vo'
import type { GetClimbingConditionsInput } from '../dtos/climbing-conditions.dto'
import { WeatherCacheService } from '../services/weather-cache.service'

@Injectable()
export class GetClimbingConditionsUseCase {
  constructor(
    @Inject(WeatherCacheService)
    private readonly weatherCacheService: WeatherCacheService,

    @Inject(ClimbingConditionsScoringService)
    private readonly scoringService: ClimbingConditionsScoringService,

    @Inject(Logger)
    private readonly logger: Logger,
  ) {}

  /**
   * Execute the use case
   */
  async execute(
    input: GetClimbingConditionsInput,
  ): Promise<ClimbingConditionsResult> {
    this.logger.debug(
      'weather:conditions',
      `Getting conditions for (${input.latitude.toFixed(2)}, ${input.longitude.toFixed(2)})`,
    )

    // Validate and parse aspect
    const aspect = this.parseAspect(input.aspect)

    // Get weather data (with caching)
    const weatherData = await this.weatherCacheService.getWeatherByCoordinates(
      input.latitude,
      input.longitude,
    )

    // Calculate conditions
    const scoringResult = this.scoringService.calculateFromWeatherData(
      weatherData,
      aspect,
      input.seasonOverride,
    )

    // Get cache TTL for metadata
    const cacheTtl = await this.weatherCacheService.getCacheTtl(
      input.latitude,
      input.longitude,
    )
    const cachedUntil = new Date(Date.now() + cacheTtl)

    const conditions = scoringResult.getConditions()

    this.logger.debug(
      'weather:conditions',
      `Conditions calculated: ${conditions.getLabel()} (${conditions.getOverallScore().toFixed(2)})`,
    )

    // Build current weather data
    const currentWeather: CurrentWeatherData = {
      temperature: weatherData.current.temperature,
      feelsLike:
        weatherData.current.feelsLike ?? weatherData.current.temperature,
      windSpeed: weatherData.current.windSpeed,
      windDirection: weatherData.current.windDirection ?? 'N',
      humidity: weatherData.current.humidity ?? 60,
      weatherCode: weatherData.current.weatherCode,
      isDaylight: weatherData.current.isDaylight,
      uvIndex: weatherData.current.uvIndex ?? 0,
    }

    // Build aspect recommendation if aspect is provided
    const aspectRecommendation = aspect
      ? this.scoringService.getAspectRecommendation(conditions, aspect)
      : null

    return ClimbingConditionsResult.create({
      coordinates: Coordinates.create(
        weatherData.metadata.coordinates.lat,
        weatherData.metadata.coordinates.lon,
      ),
      currentWeather,
      conditions,
      hourlyConditions: scoringResult.getHourlyConditions(),
      metadata: {
        location: weatherData.metadata.location,
        timezone: weatherData.metadata.timezone,
        lastUpdate: weatherData.metadata.lastUpdate,
        cachedUntil,
      },
      bestClimbingWindow: scoringResult.getBestClimbingWindow(),
      aspectRecommendation,
      cragId: input.cragId,
      sectorId: input.sectorId,
    })
  }

  /**
   * Parse aspect string to AspectDirection
   */
  private parseAspect(aspect?: string | null): AspectDirection | null {
    if (!aspect) return null

    const normalizedAspect = aspect.toUpperCase().trim()
    const validAspects: AspectDirection[] = [
      'N',
      'NE',
      'E',
      'SE',
      'S',
      'SW',
      'W',
      'NW',
    ]

    if (validAspects.includes(normalizedAspect as AspectDirection)) {
      return normalizedAspect as AspectDirection
    }

    this.logger.warn(
      'weather:conditions',
      `Invalid aspect "${aspect}", ignoring`,
    )
    return null
  }
}
