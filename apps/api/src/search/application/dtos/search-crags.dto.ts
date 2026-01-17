/**
 * Weather condition label for climbing conditions
 */
export type WeatherConditionLabelDto = 'excellent' | 'good' | 'fair' | 'poor'

/**
 * Weather conditions evaluation for a crag
 */
export interface WeatherConditionsDto {
  totalSectors: number
  sectorsWithGoodConditions: number
  overallScore: number
  label: WeatherConditionLabelDto
  // Detailed weather metrics (0-3 scale)
  temperatureScore?: number
  windScore?: number
  humidityScore?: number
  precipitationScore?: number
}

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

  // Seasonality preference (optional, defaults to 'any')
  seasonPreference?: 'summer' | 'winter' | 'any'

  // Result limit (optional, defaults to 20)
  limit?: number

  // NEW FILTERS - Phase 1
  // Exposure preference (sun/shade/any) - filters by sector weather tags
  exposurePreference?: 'sun' | 'shade' | 'any'

  // Climbing styles - filters by primary style of sectors
  climbingStyles?: string[] // ['sport', 'trad', 'boulder', etc.]

  // Minimum quality rating (0-3) - filters by sector overall score
  minQualityRating?: number

  // Query date for weather evaluation (ISO date: "2025-01-17")
  // If not provided, defaults to today
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
  // Grade range as gradeBand indices (10-52) - client converts to display
  minGradeBand: number | null
  maxGradeBand: number | null
  // Number of routes within the user's search grade range
  routesInRange: number
  seasonality: number[]
  hasTopo: boolean
  totalScore: number
  distanceKm: number
  scoreBreakdown: ScoreBreakdownDto
  // Weather conditions evaluation for this crag
  weatherConditions: WeatherConditionsDto | null
  // Crag quality metrics (0-3 scale)
  overallScore: number // Overall crag rating
  qualityRating: number // Quality rating based on route stars
  popularityScore: number // Popularity based on ascents
}

/**
 * Response DTO for crag search endpoint
 */
export interface SearchCragsResponseDto {
  results: ScoredCragDto[]
  total: number
  criteria: {
    latitude: number
    longitude: number
    radiusKm: number
    minGradeBand: number
    maxGradeBand: number
    seasonPreference: string
    limit: number
    exposurePreference?: string
    climbingStyles?: string[]
    minQualityRating?: number
  }
}

/**
 * Query parameters DTO for crag search endpoint (compact names)
 *
 * GET /api/search/crags?lat=41.7&lon=1.8&r=50&gmin=24&gmax=32&season=1&limit=20
 */
export type SearchCragsQueryDto = {
  /** Latitude */
  lat?: string
  /** Longitude */
  lon?: string
  /** Radius in km */
  r?: string
  /** Min grade band (10-52) */
  gmin?: string
  /** Max grade band (10-52) */
  gmax?: string
  /** Season preference: 1=summer, 2=winter, 0/omit=any */
  season?: string
  /** Exposure preference: 1=sun, 2=shade, 0/omit=any */
  exp?: string
  /** Climbing styles (can be array or single value) */
  style?: string | string[]
  /** Min quality rating (0-3) */
  qmin?: string
  /** Result limit (1-100, default 20) */
  limit?: string
  /** Query date for weather (ISO date) */
  date?: string
}
