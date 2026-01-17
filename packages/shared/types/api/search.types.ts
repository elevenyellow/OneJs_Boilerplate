/**
 * Shared search-related API types used by both backend and frontend.
 * These types should be kept in sync between all consumers.
 */

import type { WeatherConditionsDto } from './weather.types'

/**
 * Season preference for search
 */
export type SeasonPreference = 'summer' | 'winter' | 'any'

/**
 * Exposure preference for search
 */
export type ExposurePreference = 'sun' | 'shade' | 'any'

/**
 * Request DTO for crag search endpoint
 */
export interface SearchCragsRequestDto {
  // Location
  latitude: number
  longitude: number
  radiusKm: number

  // Grade range as gradeBand indices (10-52)
  minGradeBand: number
  maxGradeBand: number

  // Seasonality preference
  seasonPreference?: SeasonPreference

  // Result limit
  limit?: number

  // Exposure preference (sun/shade/any)
  exposurePreference?: ExposurePreference

  // Climbing styles (sport, trad, boulder, etc.)
  climbingStyles?: string[]

  // Minimum quality rating (0-3)
  minQualityRating?: number

  // Query date for weather evaluation (ISO date: "2025-01-17")
  queryDate?: string
}

/**
 * Individual score breakdown item in response
 */
export interface ScoreBreakdownItemDto {
  score: number
  weight: number
  weighted: number
}

/**
 * Score breakdown by strategy in response
 */
export interface ScoreBreakdownDto {
  distance: ScoreBreakdownItemDto
  gradeMatch: ScoreBreakdownItemDto
  seasonality: ScoreBreakdownItemDto
  weather: ScoreBreakdownItemDto
  routeCount: ScoreBreakdownItemDto
  exposure: ScoreBreakdownItemDto
  quality: ScoreBreakdownItemDto
  style: ScoreBreakdownItemDto
}

/**
 * Single crag result in search response
 */
export interface ScoredCragDto {
  id: string
  externalId: string
  name: string
  type: string
  subType: string
  latitude: number | null
  longitude: number | null
  headerImage: string | null
  numberRoutes: number | null
  // Grade range as gradeBand indices (10-52)
  minGradeBand: number | null
  maxGradeBand: number | null
  seasonality: number[]
  hasTopo: boolean
  totalScore: number
  distanceKm: number
  scoreBreakdown: ScoreBreakdownDto
  zoneId: string
  zoneName: string | null
  countryName: string | null
  matchPercentage: number
  weatherConditions?: WeatherConditionsDto | null
}

/**
 * Search response DTO
 */
export interface SearchCragsResponseDto {
  results: ScoredCragDto[]
  meta: {
    total: number
    limit: number
    searchCenter: {
      latitude: number
      longitude: number
    }
    radiusKm: number
    gradeRange: {
      min: number
      max: number
    }
    queryDate?: string
    weatherDataAvailable: boolean
  }
}
