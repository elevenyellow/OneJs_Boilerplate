import type { StyleFlagsData, TagsData, WarningsData } from '../value-objects'

export interface RouteCreateDto {
  id: string
  externalId: string | number
  name: string
  urlAncestorStub?: string | null
  // Grade
  grade?: string | null
  gradeBand: number
  gradeStyle?: string | null
  gradeInContext?: string | null // Grade in geographic context
  rawGradeMin?: number | null
  rawGradeMax?: number | null
  // Dimensions
  height?: number | null
  heightUnit?: string | null
  pitches?: number | null
  // Quality
  stars?: number | null
  // Popularity
  ascents?: number | null
  popularity?: number | null
  // Style & Equipment
  style?: string | null
  bolts?: number | null
  // Style flags (bitmask or scraper data)
  styleFlags?: number | null
  styleFlagsData?: StyleFlagsData | null
  // First Ascent
  firstAscent?: string | null
  equipper?: string | null
  equipDate?: string | null
  maintainer?: string | null
  maintDate?: string | null
  // Description
  description?: string | null
  descriptionHtml?: string | null
  // Status
  isClosed?: boolean
  hasWarning?: boolean
  warningText?: string | null
  // Topo
  hasTopo?: boolean
  topoNumber?: string | null
  // Hierarchy
  siblingLabel?: number | null
  depth?: number | null
  sectorId?: string | null
  cragId: string
  externalParentId?: string | null
  // Metadata
  tags?: TagsData | null
  warnings?: WarningsData | null
  akaNames?: string[] | null
  createdAt?: Date
  updatedAt?: Date
}
