/**
 * Current weather data for display
 */
export interface CurrentWeatherDto {
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
 * Climbing conditions score data
 */
export interface ClimbingConditionsScoreDto {
  overallScore: number
  temperatureScore: number
  windScore: number
  precipitationScore: number
  humidityScore: number
  label: 'excellent' | 'good' | 'moderate' | 'poor'
  recommendation: string
  isClimbable: boolean
}

/**
 * Aspect-aware recommendation
 */
export interface AspectRecommendationDto {
  aspect: string
  isOptimalForCurrentConditions: boolean
  reason: string
}

/**
 * Hourly forecast with condition score
 */
export interface HourlyForecastDto {
  time: string
  temperature: number
  windSpeed: number
  precipitationProbability: number
  humidity: number
  conditionScore: number
  label: 'excellent' | 'good' | 'moderate' | 'poor'
}

/**
 * Best climbing window in the forecast
 */
export interface BestClimbingWindowDto {
  startTime: string
  endTime: string
  averageScore: number
  hours: number
}

/**
 * Complete climbing conditions response DTO
 */
export interface ClimbingConditionsDto {
  /**
   * Location identifiers
   */
  cragId?: string
  sectorId?: string
  coordinates: {
    lat: number
    lon: number
  }

  /**
   * Current weather conditions
   */
  current: CurrentWeatherDto

  /**
   * Climbing conditions scores
   */
  conditions: ClimbingConditionsScoreDto

  /**
   * Aspect-aware recommendation (if sector has aspect)
   */
  aspectRecommendation?: AspectRecommendationDto

  /**
   * Hourly forecast with condition scores
   */
  hourlyForecast: HourlyForecastDto[]

  /**
   * Best climbing window today (if found)
   */
  bestClimbingWindow?: BestClimbingWindowDto

  /**
   * Metadata
   */
  metadata: {
    location: string
    timezone: string
    lastUpdate: string
    cachedUntil: string
  }
}

/**
 * Input for getting climbing conditions
 */
export interface GetClimbingConditionsInput {
  latitude: number
  longitude: number
  aspect?: string | null
  seasonOverride?: 'winter' | 'spring' | 'summer' | 'autumn'
  cragId?: string
  sectorId?: string
}
