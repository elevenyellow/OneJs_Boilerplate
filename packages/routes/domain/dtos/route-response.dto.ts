import type { GradeCategory } from '@grades/domain/services/grade-category'

/**
 * Protection rating based on bolt spacing (meters per bolt)
 * - well-protected: <= 2.5m between bolts
 * - normal: 2.5m - 3.5m between bolts
 * - spaced: 3.5m - 5m between bolts
 * - runout: > 5m between bolts
 * - unknown: missing data
 */
export type ProtectionRating =
  | 'well-protected'
  | 'normal'
  | 'spaced'
  | 'runout'
  | 'unknown'

/**
 * Route response DTO for API responses
 * Grade is sent as gradeBand (numeric index) - client converts to display string
 */
export interface RouteResponseDto {
  id: string
  externalId: string
  name: string

  // Grade - Sent as gradeBand, client converts to preferred system
  grade: string | null // Original grade string from source
  gradeBand: number // Universal grade index (10-52) - client converts to display
  gradeCategory: GradeCategory // Derived category for UI (easy/medium/hard/extreme)
  gradeStyle: string | null

  // Dimensions
  height: number | null
  heightUnit: string | null
  pitches: number | null

  // Quality
  stars: number | null

  // Popularity
  ascents: number | null

  // Style & Equipment
  style: string | null
  bolts: number | null

  // Style (bitmask decoded for convenience)
  styleFlags: number
  primaryStyle: string

  // Status
  isClosed: boolean
  hasWarning: boolean
  warningText: string | null

  // Topo
  hasTopo: boolean
  topoNumber: string | null

  // Hierarchy
  siblingLabel: number | null
  sectorId: string | null
  cragId: string
}

/**
 * Comprehensive route DTO for sector route list
 * Contains all relevant data for climbers since we don't have a detail view
 * Grade is sent as gradeBand (numeric index) - client converts to display string
 */
export interface RouteListItemDto {
  id: string
  externalId: string
  name: string
  akaNames: string[]

  // Grade - Sent as gradeBand, client converts to preferred system
  gradeBand: number // Universal grade index (10-52) - client converts to display
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
  boltSpacing: number | null

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
