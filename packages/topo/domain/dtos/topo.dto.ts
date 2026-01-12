/**
 * DTO for S3 image URLs (used when updating optimized images)
 */
export interface S3ImageUrlsDto {
  thumbnailS3Url: string
  fullImageS3Url: string
  originalSourceUrl: string
}

/**
 * DTO for topo save result
 */
export interface TopoSaveResultDto {
  topo: import('../entities/topo-image.entity').TopoImageEntity
  positionsCreated: number
}

/**
 * DTO for crag topo save result
 */
export interface CragTopoSaveResultDto {
  topo: import('../entities/crag-topo-image.entity').CragTopoImageEntity
  positionsCreated: number
}

/**
 * DTO for route position data on a topo
 */
export interface RouteOnTopoDto {
  routeId: string
  topoNumber: string
  points: string
  gradeClass: string | null
}

/**
 * DTO for sector position data on a crag topo
 */
export interface CragTopoSectorPositionDto {
  sectorId: string | null
  areaNumber: string
  areaName: string
  points: string
  externalAreaId: number | null
  areaUrl: string | null
}

/**
 * DTO for crag topo with sector positions
 */
export interface CragTopoWithPositionsDto {
  id: string
  externalId: string
  thumbnailUrl: string
  fullImageUrl: string
  width: number
  height: number
  originalWidth: number
  originalHeight: number
  viewScale: number
  sectorPositions: CragTopoSectorPositionDto[]
}
