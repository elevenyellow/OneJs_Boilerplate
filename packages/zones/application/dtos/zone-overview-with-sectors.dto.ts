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
  numberTopos: number | null
  kudos: number | null
  subAreaCount: number | null
  averageHeight: number | null
  averageHeightUnit: string | null
  aspect: string | null
  walkInTime: string | null
  climbingStyle: string | null
  // Location for directions
  latitude: number | null
  longitude: number | null
  approach: string | null
  // Important tags
  tagFamily: string | null // KID_FRIENDLY, NOT_KID_FRIENDLY
  tagWeather: string[] | null // ALL_DAY_SUN, MORNING_SUN, etc.
  tagCrowds: string | null // DESERTED, QUIET, BUSY, CROWDED
  // Grade distribution
  gbRoutes: number[] | null // Distribution of routes by grade band
  gbAscents: number[] | null // Distribution of ascents by grade band
  // Grade range as gradeBand indices (10-52) - client converts to display
  minGradeBand: number | null
  maxGradeBand: number | null
  // Human-readable labels (parsed from backend)
  aspectLabel: string | null // e.g., "Norte", "Sureste"
  walkInTimeLabel: string | null // e.g., "< 5 min", "10-20 min"
  familyLabel: string | null // e.g., "Apto niños"
  weatherLabels: string[] | null // e.g., ["Sol todo el día", "Sombra tarde"]
  crowdsLabel: string | null // e.g., "Tranquilo", "Concurrido"
  starRating: number // 0-3 stars based on kudos
  // Beta information
  beta: ParsedBetaDto[] | null
  // Sector header image from database
  headerImage: string | null
}

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

export interface SectorAreaAnnotationDto {
  id: string
  annotationId: string
  sectorId: string | null
  sectorName: string
  svgPath: string
  color: string
  routeCount: number | null
  // Grade range as gradeBand indices (10-52) - client converts to display
  minGradeBand: number | null
  maxGradeBand: number | null
}

export interface RouteLineAnnotationDto {
  id: string
  annotationId: string
  routeId: string | null
  externalRouteId: string | null
  routeName: string
  // Grade as gradeBand index (10-52) - client converts to display
  gradeBand: number | null
  topoNumber: string
  svgPath: string
  color: string
}
