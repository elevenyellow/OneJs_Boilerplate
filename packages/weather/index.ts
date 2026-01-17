/**
 * @packages/weather-api
 *
 * Meteoblue weather API client for climbing zones
 * Provides weather data by coordinates or city name
 *
 * Features:
 * - Weather data fetching (current, hourly, daily)
 * - Climbing conditions scoring (aspect-aware, season-aware)
 * - In-memory caching with configurable TTL
 */

// Application services
export { GeocodingService } from './application/services/geocoding.service'
export { WeatherService } from './application/services/weather.service'
export { WeatherCacheService } from './application/services/weather-cache.service'

// Use cases
export { GetClimbingConditionsUseCase } from './application/use-cases/get-climbing-conditions.use-case'

// DTOs
export type {
  ClimbingConditionsDto,
  CurrentWeatherDto,
  ClimbingConditionsScoreDto,
  AspectRecommendationDto,
  HourlyForecastDto,
  BestClimbingWindowDto,
  GetClimbingConditionsInput,
} from './application/dtos/climbing-conditions.dto'

// Infrastructure
export { MeteoblueClient } from './infrastructure/http/meteoblue.client'
export {
  InMemoryWeatherCache,
  type WeatherCacheConfig,
  type WeatherCacheStats,
} from './infrastructure/cache/in-memory-weather-cache'

// Domain entities
export type {
  CurrentWeather,
  DailyForecast,
  HourlyForecast,
  MeteoblueAPIResponse,
  WeatherData,
} from './domain/entities/weather-response.entity'

// Domain value objects
export { Coordinates } from './domain/value-objects/coordinates.vo'
export { ClimbingConditionsScore } from './domain/value-objects/climbing-conditions-score.vo'
export type {
  ClimbingConditionsInput,
  ClimbingConditionsWeights,
  ClimbingConditionsScorePrimitives,
} from './domain/value-objects/climbing-conditions-score.vo'
export { TemperatureScore } from './domain/value-objects/temperature-score.vo'
export type {
  AspectDirection,
  Season,
} from './domain/value-objects/temperature-score.vo'
export { WindScore } from './domain/value-objects/wind-score.vo'
export { PrecipitationScore } from './domain/value-objects/precipitation-score.vo'
export { HumidityScore } from './domain/value-objects/humidity-score.vo'

// Domain services
export { ClimbingConditionsScoringService } from './domain/services/climbing-conditions-scoring.service'

// Domain value objects - results
export {
  BestClimbingWindow,
  BestClimbingWindowInput,
} from './domain/value-objects/best-climbing-window.vo'
export { HourlyConditionScore } from './domain/value-objects/hourly-condition-score.vo'
export { ClimbingConditionsResult } from './domain/value-objects/climbing-conditions-result.vo'
export type {
  ClimbingConditionsResultPrimitives,
  CurrentWeatherData,
  WeatherMetadata,
  AspectRecommendation,
} from './domain/value-objects/climbing-conditions-result.vo'
export { ScoringResult } from './domain/value-objects/scoring-result.vo'
