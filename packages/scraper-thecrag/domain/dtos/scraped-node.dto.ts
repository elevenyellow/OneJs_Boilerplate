import type { GeometryData, BetaItemData } from '@climb-zone/shared'

/**
 * Raw route data from TheCrag API
 */
export interface ScrapedRouteData {
  id: number
  name: string
  grade: string | null
  gradeIndex: number | null
  height: number | null
  pitches: number | null
  quality: number | null
  stars: number | null
  ascents: number | null
  subType: string | null
  bolts: number | null
  firstAscent: string | null
  tags: unknown
  warnings: unknown
}

/**
 * Node info from TheCrag API
 */
export interface ScrapedNodeInfo {
  geometry?: GeometryData
  googleMapsUrl?: string
  seasonality?: number[]
  tags?: Record<string, unknown>
  orientation?: string
  rockType?: string
  climbingStyle?: string[]
  sunExposure?: string
  sheltered?: boolean
  beta?: BetaItemData[]
  ascentCount?: number
  averageHeight?: number | [number, string]
  displayAverageHeight?: number | [number, string]
  numberRoutes?: number
  numberPhotos?: number
  numberTopos?: number
  hasTopo?: number | boolean
  subAreaCount?: number
  totalFavorites?: number
  kudos?: number
  maxPop?: number
  altNames?: string[]
  description?: string
  approach?: string
  siblingLabel?: string
  priceCategory?: string
  permitNode?: unknown
  locatedness?: number
  urlStub?: string
  urlAncestorStub?: string
  urlShortestStub?: string
  urlShortestAncestorStub?: string
  redirectStubs?: string[]
  lastPDFSize?: string
  lastPDFStaticDate?: string
  lastPDFStaticSize?: string
  isTLC?: boolean
  hide?: unknown
  hasUnarchivedChildren?: number | boolean
  unique?: boolean
}

/**
 * A scraped node from TheCrag - can be Crag, Area, Sector, Cliff
 */
export interface ScrapedCragNode {
  id: number
  name: string
  type: string // Region, Area, Crag, Sector, Cliff
  info?: ScrapedNodeInfo
  children: ScrapedCragNode[]
  routes?: ScrapedRouteData[]
}

/**
 * Result of parsing a height value from TheCrag
 * Height comes as [value, unit] or just a number
 */
export function parseHeight(height: unknown): number | null {
  if (height === null || height === undefined) return null

  if (Array.isArray(height) && height.length >= 1) {
    const value = parseFloat(String(height[0]))
    return isNaN(value) ? null : value
  }

  if (typeof height === 'number') return height
  if (typeof height === 'string') {
    const value = parseFloat(height)
    return isNaN(value) ? null : value
  }

  return null
}
