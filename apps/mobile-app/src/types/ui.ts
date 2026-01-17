/**
 * UI-specific type definitions for the mobile app.
 *
 * These types represent data structures used for UI rendering,
 * distinct from API response types (see api.ts).
 */

import type { WeatherConditionsDto } from './api'

/**
 * Sector data transformed for UI display.
 * Used in lists, cards, and map markers.
 */
export interface SectorUI {
  id: string
  name: string
  location: string
  imageUrl: string
  temperature: number
  condition: 'shade' | 'sun' | 'partial' | 'cloudy'
  distanceKm?: number
  routeCount: number
  /** Number of routes matching the user's grade filter range */
  routesInRange?: number
  /** Grade range - display string computed from gradeBand in component */
  gradeRange: string
  isBestMatch?: boolean
  /** Sector latitude coordinate for map display */
  latitude?: number | null
  /** Sector longitude coordinate for map display */
  longitude?: number | null
  /** Weather conditions evaluation for this crag (optional) */
  weatherConditions?: WeatherConditionsDto
  /** Crag type (CRAG, BOULDER_AREA, etc.) */
  type?: string
  /** Crag subtype (SPORT_CLIMBING, TRAD_CLIMBING, etc.) */
  subType?: string
  /** Seasonality scores - array of 12 values (one per month, index 0 = Jan) */
  seasonality?: number[]
  /** Whether topo is available */
  hasTopo?: boolean
  /** Total relevance score (0-1) */
  totalScore?: number
  /** Overall crag quality score (0-3 scale, like stars) */
  overallScore?: number
  /** Quality rating based on route stars (0-3 scale) */
  qualityRating?: number
  /** Popularity score based on ascents (0-3 scale) */
  popularityScore?: number
}

/**
 * Extended sector data for zone/crag detail views.
 * Includes additional metadata like sector stats, tags, and walk-in info.
 */
export interface ZoneSectorUI extends SectorUI {
  vectors: { path: string; color: string }[]
  stats: { easy: number; medium: number; hard: number; extreme: number }
  /** Aspect label (e.g., 'North', 'South') */
  aspectLabel?: string | null
  /** Walk-in time label (e.g., '5 min', '30 min') */
  walkInTimeLabel?: string | null
  /** Family-friendly label */
  familyLabel?: string | null
  /** Weather-related labels */
  weatherLabels?: string[] | null
  /** Crowds/popularity label */
  crowdsLabel?: string | null
  /** Climbing style (e.g., 'Sport', 'Trad') */
  climbingStyle?: string | null
  /** Average route height in meters or feet */
  averageHeight?: number | null
  /** Unit for averageHeight */
  averageHeightUnit?: string | null
  /** Star rating (0-3 scale) */
  starRating?: number
  /** Number of topo images available */
  numberTopos?: number | null
  /** Family tag */
  tagFamily?: string | null
  /** Weather tags */
  tagWeather?: string[] | null
  /** Crowds tag */
  tagCrowds?: string | null
}

/**
 * Generic filter option for UI selectors.
 */
export interface FilterOption {
  id: string
  label: string
  color?: string
}
