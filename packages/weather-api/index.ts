/**
 * @packages/weather-api
 *
 * Meteoblue weather API client for climbing zones
 * Provides weather data by coordinates or city name
 */

export { GeocodingService } from './application/services/geocoding.service'
export { WeatherService } from './application/services/weather.service'
export { MeteoblueClient } from './infrastructure/http/meteoblue.client'

// Domain exports
export type {
  CurrentWeather,
  DailyForecast,
  HourlyForecast,
  MeteoblueAPIResponse,
  WeatherData,
} from './domain/entities/weather-response.entity'
export { Coordinates } from './domain/value-objects/coordinates.vo'
