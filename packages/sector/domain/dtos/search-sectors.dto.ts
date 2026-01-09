import type { SectorEntity } from '../entities/sector.entity'

/**
 * DTO for sector search request
 */
export interface SearchSectorsDto {
  // User location (required)
  userLocation: { lat: number; lon: number }
  maxDistance?: number // km, default: 100

  // User grade range (required)
  gradeRange: { min: string; max: string } // e.g., "6b" to "7a"

  // Seasonality (optional, defaults to current month)
  currentMonth?: number // 1-12
  forceOrientation?: 'sun' | 'shade' | 'any' // override automatic orientation selection

  // Optional filters
  minRoutes?: number // minimum number of routes in sector
  rockTypes?: string[] // ['Limestone', 'Granite', 'Sandstone']
  climbingStyles?: string[] // ['Overhang', 'Slab', 'Vertical', 'Roof']
  hasTopo?: boolean // require sectors with topos/croquis
  requiresNoPermit?: boolean // exclude sectors requiring permits

  // Pagination
  limit?: number // default: 20
  offset?: number // default: 0
}

/**
 * Individual search result with scoring and metadata
 */
export interface SearchSectorResult {
  sector: ReturnType<SectorEntity['toJSON']> // Serialized sector entity
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
}

/**
 * Complete search response
 */
export interface SearchSectorsResponse {
  results: SearchSectorResult[]
  total: number
  filters: SearchSectorsDto // applied filters
  metadata: {
    searchTime: number // ms
    detectedSeason: 'summer' | 'winter' | 'spring' | 'autumn'
    preferredOrientation: 'sun' | 'shade' | 'any'
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

  // Pagination
  limit: number
  offset: number
}
