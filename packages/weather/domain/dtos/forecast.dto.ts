import type { DailyForecast, HourlyForecast, ClimbingCondition, WeatherCondition } from '../entities/forecast.entity'

export interface ForecastDto {
  id: string
  zoneId: string
  zoneName: string
  daily: DailyForecastDto[]
  fetchedAt: Date
  source: string
}

export interface DailyForecastDto {
  date: string
  sunrise: string
  sunset: string
  tempMin: number
  tempMax: number
  humidity: number
  precipitation: number
  precipitationProbability: number
  condition: WeatherCondition
  windSpeed: number
  windGust: number
  uvIndex: number
  climbingCondition: ClimbingCondition
  hourly?: HourlyForecastDto[]
}

export interface HourlyForecastDto {
  hour: number
  temperature: number
  feelsLike: number
  humidity: number
  precipitation: number
  precipitationProbability: number
  windSpeed: number
  windDirection: string
  windGust: number
  condition: WeatherCondition
  cloudCover: number
  uvIndex: number
}

export interface ForecastSummaryDto {
  zoneId: string
  zoneName: string
  today: DailyForecastDto | null
  nextDays: DailyForecastDto[]
  bestClimbingDay: DailyForecastDto | null
  isStale: boolean
}

export interface GetForecastRequestDto {
  zoneId: string
  days?: number // Default 7
  includeHourly?: boolean // Default false
}


