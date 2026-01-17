/**
 * API Type Definitions
 * Types matching backend DTOs for crag search
 */

/**
 * Weather condition label for climbing conditions
 */
export type WeatherConditionLabel = 'excellent' | 'good' | 'fair' | 'poor'

/**
 * Weather conditions evaluation for a crag
 * Matches: apps/api/src/search/application/dtos/search-crags.dto.ts
 */
export interface WeatherConditionsDto {
  totalSectors: number
  sectorsWithGoodConditions: number
  overallScore: number
  label: WeatherConditionLabel
  // Detailed weather metrics (0-3 scale) - optional for now
  temperatureScore?: number
  windScore?: number
  humidityScore?: number
  precipitationScore?: number
}

/**
 * Request DTO for crag search endpoint
 * Matches: apps/api/src/search/application/dtos/search-crags.dto.ts
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
  weather: ScoreBreakdownItemDto // NEW: Current weather conditions
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
  // Grade range as gradeBand indices (10-52) - use GradeConverter.fromIndex() to display
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
 * Zone Overview with Sectors
 * Matches: packages/zones/application/dtos/zone-overview-with-sectors.dto.ts
 */
/**
 * Supported grading systems for climbing routes
 * Maps to GradingSystem enum in @sectors/domain/value-objects/grade-bands.vo.ts
 */
export type GradingSystem =
  | 'FRENCH' // French sport climbing (5a, 6b+, 7c, etc.)
  | 'YDS' // Yosemite Decimal System (5.10a, 5.12d, etc.)
  | 'UIAA' // UIAA scale (IV, VI+, IX, etc.)
  | 'BRITISH' // British adjectival (M, VD, HVS, E1, etc.)
  | 'FONT' // Fontainebleau bouldering (6A, 7C+, etc.)
  | 'HUECO' // Hueco V-scale bouldering (V0, V5, etc.)

/**
 * Parsed Beta DTO for approach/access information
 */
export interface ParsedBetaDto {
  name: string
  originalMarkdown: string
  keyInfo: {
    walkTime: string | null
    distance: string | null
    difficulty: string | null
  }
  warnings: string[]
  tips: string[]
  sections: Array<{
    type:
      | 'text'
      | 'list'
      | 'time'
      | 'distance'
      | 'difficulty'
      | 'warning'
      | 'tip'
    icon: string
    content: string
    color: string
  }>
}

export interface ZoneOverviewWithSectorsDto {
  zone: {
    id: string
    name: string
  }
  crag: {
    id: string
    externalId: string
    name: string
    type: string
    numberRoutes: number | null
    hasSectors: boolean
    beta: ParsedBetaDto[] | null
    // Location for directions
    latitude: number | null
    longitude: number | null
  }
  sectors: SectorDto[]
  photos: SectorPhotoWithAreasDto[]
}

/**
 * Sector DTO
 */
export interface SectorDto {
  id: string
  externalId: string
  name: string
  depth: number
  parentId: string | null
  cragId: string
  hasSubSectors: boolean
  hasTopo: boolean
  numberRoutes: number | null
  headerImage: string | null
  numberTopos: number | null
  kudos: number | null
  subAreaCount: number | null
  averageHeight: number | null
  averageHeightUnit: string | null
  aspect: string | null
  walkInTime: string | null
  climbingStyle: string | null
  // Important tags
  tagFamily: string | null // KID_FRIENDLY, NOT_KID_FRIENDLY
  tagWeather: string[] | null // ALL_DAY_SUN, MORNING_SUN, etc.
  tagCrowds: string | null // DESERTED, QUIET, BUSY, CROWDED
  // Grade distribution
  gbRoutes: number[] | null // Distribution of routes by grade
  gbAscents: number[] | null // Distribution of ascents by grade
  // Grade range as gradeBand indices - use GradeConverter.fromIndex() to display
  minGradeBand: number | null
  maxGradeBand: number | null
  // Human-readable labels (parsed from backend)
  aspectLabel: string | null // e.g., "Norte", "Sureste"
  walkInTimeLabel: string | null // e.g., "< 5 min", "10-20 min"
  familyLabel: string | null // e.g., "Apto niños"
  weatherLabels: string[] | null // e.g., ["Sol todo el día", "Sombra tarde"]
  crowdsLabel: string | null // e.g., "Tranquilo", "Concurrido"
  starRating: number // 0-3 stars based on kudos
  // Location for directions
  latitude: number | null
  longitude: number | null
  approach: string | null // Access/approach description
  // Beta information
  beta: ParsedBetaDto[] | null
}

/**
 * Sector Photo with Areas DTO
 */
export interface SectorPhotoWithAreasDto {
  id: string
  externalId: string
  fullImageUrl: string
  thumbnailUrl: string
  width: number
  height: number
  originalWidth: number
  originalHeight: number
  viewScale: number
  isOverview: boolean
  cragId: string | null
  sectorId: string | null
  sectorAreas: SectorAreaAnnotationDto[]
  routeLines: RouteLineAnnotationDto[]
}

/**
 * Sector Area Annotation DTO
 */
export interface SectorAreaAnnotationDto {
  id: string
  annotationId: string
  sectorId: string | null
  sectorName: string
  svgPath: string
  color: string
  routeCount: number | null
  // Grade range as gradeBand indices - use GradeConverter.fromIndex() to display
  minGradeBand: number | null
  maxGradeBand: number | null
}

/**
 * Route Line Annotation DTO
 */
export interface RouteLineAnnotationDto {
  id: string
  annotationId: string
  routeId: string | null
  externalRouteId: string | null
  routeName: string
  // Grade as gradeBand index - use GradeConverter.fromIndex() to display
  gradeBand: number | null
  topoNumber: string
  svgPath: string
  color: string
}

/**
 * Protection rating based on bolt spacing (meters per bolt)
 * Matches: packages/routes/domain/dtos/route-response.dto.ts
 */
export type ProtectionRating =
  | 'well-protected'
  | 'normal'
  | 'spaced'
  | 'runout'
  | 'unknown'

/**
 * Grade category for UI coloring
 * Matches: packages/grades/domain/services/grade-category.ts
 */
export type GradeCategory = 'easy' | 'medium' | 'hard' | 'extreme' | 'unknown'

/**
 * Comprehensive Route DTO for sector route list
 * Contains all relevant data for climbers since we don't have a detail view
 * Matches: packages/routes/domain/dtos/route-response.dto.ts RouteListItemDto
 */
export interface RouteDto {
  id: string
  externalId: string
  name: string
  akaNames: string[]

  // Grade - gradeBand sent from API, use GradeConverter.fromIndex() to display
  gradeBand: number // Universal grade index (10-52)
  gradeCategory: GradeCategory // Derived category for UI coloring
  gradeStyle: string | null

  // Dimensions
  height: number | null
  heightUnit: string
  heightDisplay: string | null
  pitches: number | null
  isMultiPitch: boolean

  // Equipment & Protection
  bolts: number | null
  protectionRating: ProtectionRating
  boltSpacing: number | null // Meters per bolt

  // Style
  style: string | null
  styleFlags: number
  primaryStyle: string
  activeStyles: string[]

  // Quality
  stars: number | null
  isClassic: boolean

  // History
  firstAscent: string | null
  equipper: string | null
  equipDate: string | null
  maintainer: string | null
  maintDate: string | null
  equipmentAgeYears: number | null
  needsMaintenanceReview: boolean

  // Status
  isClosed: boolean
  hasWarning: boolean
  warningText: string | null

  // Beta
  description: string | null

  // Topo
  hasTopo: boolean
  topoNumber: string | null
  siblingLabel: number | null

  // Hierarchy
  sectorId: string | null
  cragId: string
}

/**
 * Response from GET /api/sectors/:sectorId/routes
 * Contains sector details, hierarchy, photos, and routes in a single response
 */
export interface SectorRoutesResponse {
  // Sector details
  sector: SectorDto
  parent: SectorDto | null
  children: SectorDto[]
  photos: SectorPhotoWithAreasDto[]
  // Routes
  routes: RouteDto[]
  totalCount: number
}

/**
 * Sector details with hierarchy
 * Response from GET /api/sectors/:sectorId/details-with-hierarchy
 */
export interface SectorDetailsWithHierarchy {
  // Current sector
  sector: SectorDto
  // Parent sector (if any)
  parent: SectorDto | null
  // Child sectors
  children: SectorDto[]
  // Sibling sectors (same parent)
  siblings: SectorDto[]
  // Topo photos with route annotations
  photos: SectorPhotoWithAreasDto[]
  // Routes in this sector
  routes: RouteDto[]
}

/**
 * Crag overview with sectors
 * Response from GET /api/crags/:cragId/overview-photo-with-sectors
 */
export interface CragOverviewWithSectors {
  crag: {
    id: string
    externalId: string
    name: string
    type: string
    subType: string
    headerImage: string | null
    numberRoutes: number | null
    hasSectors: boolean
    latitude: number | null
    longitude: number | null
  }
  overviewPhoto: SectorPhotoWithAreasDto | null
}

// Type aliases for backwards compatibility
export type SectorPhotoWithAreas = SectorPhotoWithAreasDto
export type SectorAreaAnnotation = SectorAreaAnnotationDto
export type RouteLineAnnotation = RouteLineAnnotationDto

// ============================================
// WEATHER & CLIMBING CONDITIONS TYPES
// ============================================

/**
 * Current weather data for display
 * Matches: packages/weather/application/dtos/climbing-conditions.dto.ts
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
 * Climbing conditions score (0-3 scale)
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
 * Complete climbing conditions response
 * Matches: packages/weather/application/dtos/climbing-conditions.dto.ts
 */
export interface ClimbingConditionsDto {
  /** Location identifiers */
  cragId?: string
  sectorId?: string
  coordinates: {
    lat: number
    lon: number
  }

  /** Current weather conditions */
  current: CurrentWeatherDto

  /** Climbing conditions scores */
  conditions: ClimbingConditionsScoreDto

  /** Aspect-aware recommendation (if sector has aspect) */
  aspectRecommendation?: AspectRecommendationDto

  /** Hourly forecast with condition scores */
  hourlyForecast: HourlyForecastDto[]

  /** Best climbing window today (if found) */
  bestClimbingWindow?: BestClimbingWindowDto

  /** Metadata */
  metadata: {
    location: string
    timezone: string
    lastUpdate: string
    cachedUntil: string
  }
}

/**
 * Request for climbing conditions by coordinates
 */
export interface GetClimbingConditionsRequest {
  latitude: number
  longitude: number
  aspect?: string | null
}
