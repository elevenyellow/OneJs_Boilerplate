import type { WeatherCondition } from '../entities/weather-forecast.entity'

/**
 * DTO for raw weather data extracted from meteoblue
 */
export interface DailyWeatherDataDto {
  date: Date
  tempMin: number
  tempMax: number
  rainProb: number
  windSpeed: number
  windDirection?: string
  humidity: number
  condition: WeatherCondition
  conditionIcon?: string
  uvIndex?: number
}

/**
 * DTO for hourly weather data
 */
export interface HourlyWeatherDataDto {
  date: Date
  hour: number
  tempCurrent: number
  tempMin: number
  tempMax: number
  rainProb: number
  windSpeed: number
  windDirection?: string
  humidity: number
  condition: WeatherCondition
  conditionIcon?: string
}

/**
 * Complete weather response for a zone
 */
export interface ZoneWeatherDto {
  zoneId: string
  zoneName: string
  locationName: string
  daily: DailyWeatherDataDto[]
  hourly: HourlyWeatherDataDto[]
  fetchedAt: Date
}

/**
 * Request DTO for fetching weather
 */
export interface FetchWeatherRequestDto {
  zoneId: string
  zoneName: string
  latitude: number
  longitude: number
}

/**
 * DTO representing a climbing zone with coordinates
 * This is a minimal interface - will be integrated with actual ClimbingZone entity later
 */
export interface ClimbingZoneCoordinates {
  id: string
  name: string
  slug: string
  latitude: number
  longitude: number
}
