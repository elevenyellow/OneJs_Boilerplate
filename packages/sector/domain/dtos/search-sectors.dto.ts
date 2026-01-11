import type { SectorEntity } from '../entities/sector.entity'

/**
 * Route summary for search results
 */
export interface RouteSearchInfo {
  id: string
  externalId: number
  name: string
  grade: string | null
  gradeIndex: number | null
  height: number | null
  pitches: number | null
  bolts: number | null
  stars: number | null
  quality: number | null
  ascents: number | null
  subType: string | null
  firstAscent: string | null
  topoNumber: string | null
}

/**
 * Crag/Zone information
 */
export interface CragInfo {
  id: string
  name: string
  altNames: string[]
  latitude: number | null
  longitude: number | null
  description: string | null
  approach: string | null
  numberPhotos: number | null
  numberTopos: number | null
  hasTopo: boolean
  totalFavorites: number | null
  urlStub: string | null
  priceCategory: string | null
}

/**
 * DTO for sector search request
 */
export interface SearchSectorsDto {
  // User location (required)
  userLocation: { lat: number; lon: number }
  maxDistance?: number // km, default: 100

  // User grade range (required)
  gradeRange: { min: string; max: string } // e.g., "6b" to "7a"

  // Orientation preference (optional, auto-detected from weather if not specified)
  forceOrientation?: 'sun' | 'shade' | 'any'

  // Optional filters
  minRoutes?: number // minimum number of routes in sector
  rockTypes?: string[] // ['Limestone', 'Granite', 'Sandstone']
  climbingStyles?: string[] // ['Overhang', 'Slab', 'Vertical', 'Roof']
  hasTopo?: boolean // require sectors with topos/croquis
  requiresNoPermit?: boolean // exclude sectors requiring permits

  // Tag-based filters
  kidFriendly?: boolean // true = require kid friendly, false = exclude not kid friendly
  dogFriendly?: boolean // require dog friendly sectors
  beginner?: boolean // require beginner-friendly sectors
  accessible?: boolean // require accessible sectors

  // Pagination
  limit?: number // default: 20
  offset?: number // default: 0
}

/**
 * Individual search result with scoring and metadata
 */
export interface SearchSectorResult {
  sector: ReturnType<SectorEntity['toJSON']> & {
    cragName: string | null // Extracted from urlAncestorStub (for backward compatibility)
    coordinates: { lat: number; lon: number } | null // Sector coordinates
    routes: RouteSearchInfo[] // List of routes in the sector
  }
  relevanceScore: number // 0-100
  distance: number // distance in km
  routesInUserRange: number // number of routes matching user's grade range
  matchReasons: string[] // Human-readable reasons for match
  scoringBreakdown: {
    gradeMatch: number // 0-40 points
    distance: number // 0-20 points
    orientation: number // 0-15 points
    popularity: number // 0-10 points
    routeCount: number // 0-10 points
    quality: number // 0-5 points
  }
  // Weather and conditions recommendation (optional)
  conditions?: {
    weatherScore: number // 0-100 - based on real-time weather
    seasonalityScore: number // 0-100 - based on TheCrag historical data
    orientationBonus: number // 0-10 - bonus for perfect orientation match
    combinedScore: number // weighted combination of all factors
    reasons: string[] // human-readable explanations
    isGoodDay: boolean // overall recommendation
  }
}

/**
 * Crag/School with its recommended sectors
 */
export interface CragWithSectors {
  crag: CragInfo
  sectors: SearchSectorResult[]
  avgRelevanceScore: number // Average score of all sectors
  totalRoutesInRange: number // Total routes across all sectors in user's grade range
  distance: number // Distance to nearest sector
  totalSectorsInCrag: number // Total number of sectors in the crag (not just recommended ones)
}

/**
 * Complete search response (grouped by crags/schools)
 */
export interface SearchSectorsResponse {
  results: CragWithSectors[]
  total: number // Total number of crags with matching sectors
  totalSectors: number // Total number of individual sectors
  totalRoutes: number // Total number of routes across all sectors
  totalRoutesInRange: number // Total number of routes in user's grade range
  filters: SearchSectorsDto // applied filters
  metadata: {
    searchTime: number // ms
    preferredOrientation: 'sun' | 'shade' | 'any'
    weatherLocationsQueried?: number // number of unique weather locations fetched
    weather?: {
      temperature: number
      conditions: string
      isGoodForClimbing: boolean
    }
  }
}

/**
 * Internal filters for repository query
 */
export interface AdvancedSearchFilters {
  // Geographic bounds
  latitudeMin: number
  latitudeMax: number
  longitudeMin: number
  longitudeMax: number

  // Grade range
  minGradeIndex: number
  maxGradeIndex: number

  // Optional filters
  minRoutes?: number
  rockTypes?: string[]
  climbingStyles?: string[]
  hasTopo?: boolean
  requiresNoPermit?: boolean

  // Tag-based filters
  kidFriendly?: boolean
  dogFriendly?: boolean
  beginner?: boolean
  accessible?: boolean

  // Pagination
  limit: number
  offset: number
}
