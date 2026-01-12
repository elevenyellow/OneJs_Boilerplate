import type { CragEntity } from '../entities/crag.entity'

/**
 * DTO for crag with location metadata
 */
export interface CragWithLocationDto {
  crag: CragEntity
  countryName: string
  regionName: string | null
  averageHeight: number | null
}

/**
 * DTO for nearby crags search parameters
 */
export interface FindNearbyCragsDto {
  latitude: number
  longitude: number
  maxDistanceKm: number
  search?: string
  limit?: number
  offset?: number
}

/**
 * DTO for nearby crags search result
 */
export interface NearbyCragsResultDto {
  crags: CragEntity[]
  total: number
}

/**
 * DTO for header image data
 */
export interface HeaderImageDto {
  headerImageUrl: string
  headerImageWidth?: number
  headerImageHeight?: number
}

/**
 * DTO for S3 header image URLs
 */
export interface HeaderImageS3Dto {
  s3Url: string
  s3UrlFull: string
  originalUrl: string
}

/**
 * DTO for overview topo image data
 */
export interface OverviewTopoDto {
  overviewTopoImageUrl: string
  overviewTopoThumbnailUrl?: string
  overviewTopoWidth?: number
  overviewTopoHeight?: number
  overviewTopoExternalId?: string
}
