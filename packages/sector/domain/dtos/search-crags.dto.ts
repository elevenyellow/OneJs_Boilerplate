import type { SectorEntity } from '../entities/sector.entity'

/**
 * DTO for crag search request (same as sector search)
 */
export interface SearchCragsDto {
  // User location (required)
  userLocation: { lat: number; lon: number }
  maxDistance?: number // km, default: 100

  // User grade range (required)
  gradeRange: { min: string; max: string } // e.g., "6b" to "7a"

  // Orientation preference (optional, auto-detected from weather if not specified)
  forceOrientation?: 'sun' | 'shade' | 'any'

  // Optional filters
  minRoutes?: number // minimum number of routes per sector
  rockTypes?: string[] // ['Limestone', 'Granite', 'Sandstone']
  climbingStyles?: string[] // ['Overhang', 'Slab', 'Vertical', 'Roof']
  hasTopo?: boolean // require sectors with topos/croquis
  requiresNoPermit?: boolean // exclude sectors requiring permits

  // Pagination
  limit?: number // default: 20 crags
  offset?: number // default: 0
}

/**
 * Sector result within a crag
 */
export interface CragSectorResult {
  sector: ReturnType<SectorEntity['toJSON']>
  routesInUserRange: number // number of routes matching user's grade range
  relevanceScore: number // individual sector score
}

/**
 * Crag result with all its sectors
 */
export interface SearchCragResult {
  // Crag info
  crag: {
    id: string
    name: string
    latitude: number | null
    longitude: number | null
    urlStub: string | null
    theCragUrl: string | null
    description: string | null
    numberPhotos: number | null
    numberTopos: number | null
    hasTopo: boolean
    totalFavorites: number | null
  }

  // Aggregated metrics
  distance: number // distance in km from user
  totalSectors: number
  totalRoutesInUserRange: number // sum of routes in user range across all sectors
  bestSectorScore: number // highest scoring sector
  averageSectorScore: number // average sector score

  // All sectors in this crag
  sectors: CragSectorResult[]

  // Overall crag relevance score
  relevanceScore: number // 0-100

  // Reasons why this crag matches
  matchReasons: string[]

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
 * Complete search response
 */
export interface SearchCragsResponse {
  results: SearchCragResult[]
  total: number
  filters: SearchCragsDto // applied filters
  metadata: {
    searchTime: number // ms
    preferredOrientation: 'sun' | 'shade' | 'any'
    totalSectorsFound: number
    totalRoutesInRange: number
    weather?: {
      temperature: number
      conditions: string
      isGoodForClimbing: boolean
    }
  }
}
