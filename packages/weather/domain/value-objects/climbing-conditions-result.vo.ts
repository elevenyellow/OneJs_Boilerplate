import { BestClimbingWindow } from './best-climbing-window.vo'
import { ClimbingConditionsScore } from './climbing-conditions-score.vo'
import { Coordinates } from './coordinates.vo'
import { HourlyConditionScore } from './hourly-condition-score.vo'

/**
 * Current weather data
 */
export interface CurrentWeatherData {
  temperature: number
  feelsLike: number
  windSpeed: number
  windDirection: string
  humidity: number
  weatherCode: number
  isDaylight: boolean
  uvIndex: number
}

/**
 * Metadata about the weather data
 */
export interface WeatherMetadata {
  location: string
  timezone: string
  lastUpdate: Date
  cachedUntil: Date
}

/**
 * Aspect-aware recommendation
 */
export interface AspectRecommendation {
  aspect: string
  isOptimalForCurrentConditions: boolean
  reason: string
}

/**
 * Serialized climbing conditions result
 */
export interface ClimbingConditionsResultPrimitives {
  cragId?: string
  sectorId?: string
  coordinates: {
    lat: number
    lon: number
  }
  current: {
    temperature: number
    feelsLike: number
    windSpeed: number
    windDirection: string
    humidity: number
    weatherCode: number
    isDaylight: boolean
    uvIndex: number
  }
  conditions: {
    overallScore: number
    temperatureScore: number
    windScore: number
    precipitationScore: number
    humidityScore: number
    label: 'excellent' | 'good' | 'moderate' | 'poor'
    recommendation: string
    isClimbable: boolean
  }
  hourlyForecast: Array<{
    time: string
    temperature: number
    windSpeed: number
    precipitationProbability: number
    humidity: number
    conditionScore: number
    label: 'excellent' | 'good' | 'moderate' | 'poor'
  }>
  metadata: {
    location: string
    timezone: string
    lastUpdate: string
    cachedUntil: string
  }
  aspectRecommendation?: {
    aspect: string
    isOptimalForCurrentConditions: boolean
    reason: string
  }
  bestClimbingWindow?: {
    startTime: string
    endTime: string
    averageScore: number
    hours: number
  }
}

/**
 * Represents the complete result of climbing conditions calculation
 */
export class ClimbingConditionsResult {
  private constructor(
    private readonly coordinates: Coordinates,
    private readonly currentWeather: CurrentWeatherData,
    private readonly conditions: ClimbingConditionsScore,
    private readonly hourlyConditions: HourlyConditionScore[],
    private readonly metadata: WeatherMetadata,
    private readonly bestClimbingWindow: BestClimbingWindow | null,
    private readonly aspectRecommendation: AspectRecommendation | null,
    private readonly cragId: string | undefined,
    private readonly sectorId: string | undefined,
  ) {}

  static create(input: {
    coordinates: Coordinates
    currentWeather: CurrentWeatherData
    conditions: ClimbingConditionsScore
    hourlyConditions: HourlyConditionScore[]
    metadata: WeatherMetadata
    bestClimbingWindow: BestClimbingWindow | null
    aspectRecommendation?: AspectRecommendation | null
    cragId?: string
    sectorId?: string
  }): ClimbingConditionsResult {
    return new ClimbingConditionsResult(
      input.coordinates,
      input.currentWeather,
      input.conditions,
      input.hourlyConditions,
      input.metadata,
      input.bestClimbingWindow,
      input.aspectRecommendation ?? null,
      input.cragId,
      input.sectorId,
    )
  }

  getCoordinates(): Coordinates {
    return this.coordinates
  }

  getCurrentWeather(): CurrentWeatherData {
    return this.currentWeather
  }

  getConditions(): ClimbingConditionsScore {
    return this.conditions
  }

  getHourlyConditions(): HourlyConditionScore[] {
    return this.hourlyConditions
  }

  getMetadata(): WeatherMetadata {
    return this.metadata
  }

  getBestClimbingWindow(): BestClimbingWindow | null {
    return this.bestClimbingWindow
  }

  getAspectRecommendation(): AspectRecommendation | null {
    return this.aspectRecommendation
  }

  getCragId(): string | undefined {
    return this.cragId
  }

  getSectorId(): string | undefined {
    return this.sectorId
  }

  hasBestClimbingWindow(): boolean {
    return this.bestClimbingWindow !== null
  }

  hasAspectRecommendation(): boolean {
    return this.aspectRecommendation !== null
  }

  toPrimitives(): ClimbingConditionsResultPrimitives {
    return {
      cragId: this.cragId,
      sectorId: this.sectorId,
      coordinates: {
        lat: this.coordinates.latitude,
        lon: this.coordinates.longitude,
      },
      current: {
        temperature: this.currentWeather.temperature,
        feelsLike: this.currentWeather.feelsLike,
        windSpeed: this.currentWeather.windSpeed,
        windDirection: this.currentWeather.windDirection,
        humidity: this.currentWeather.humidity,
        weatherCode: this.currentWeather.weatherCode,
        isDaylight: this.currentWeather.isDaylight,
        uvIndex: this.currentWeather.uvIndex,
      },
      conditions: this.conditions.toPrimitives(),
      hourlyForecast: this.hourlyConditions.map((hour) => hour.toPrimitives()),
      metadata: {
        location: this.metadata.location,
        timezone: this.metadata.timezone,
        lastUpdate: this.metadata.lastUpdate.toISOString(),
        cachedUntil: this.metadata.cachedUntil.toISOString(),
      },
      aspectRecommendation: this.aspectRecommendation
        ? {
            aspect: this.aspectRecommendation.aspect,
            isOptimalForCurrentConditions:
              this.aspectRecommendation.isOptimalForCurrentConditions,
            reason: this.aspectRecommendation.reason,
          }
        : undefined,
      bestClimbingWindow: this.bestClimbingWindow?.toPrimitives(),
    }
  }
}
