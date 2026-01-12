import { ExternalId, Url } from '@climb-zone/shared'
import { CragId } from '@crag/domain/value-objects/crag-id.vo'
import { SectorId } from '@sector/domain/value-objects/sector-id.vo'
import { ImageDimensions } from '../value-objects/image-dimensions.vo'
import { S3ImageUrls } from '../value-objects/s3-image-urls.vo'
import { TopoImageId } from '../value-objects/topo-image-id.vo'
import { TopoImageUrls } from '../value-objects/topo-image-urls.vo'
import { ViewScale } from '../value-objects/view-scale.vo'

/**
 * Position of a sector on a crag topo image
 */
export interface CragTopoSectorPositionData {
  sectorId: SectorId | null
  areaNumber: string
  areaName: string
  points: string
  zindex: number
  order: number
  externalAreaId: bigint | null
  /** Relative URL path from TheCrag (e.g., "/climbing/123456") */
  areaUrl: string | null
}

/**
 * Crag topo image entity - overview topo showing sectors
 */
export class CragTopoImageEntity {
  constructor(
    public readonly id: TopoImageId,
    public readonly externalId: ExternalId,
    public readonly cragId: CragId,
    // TheCrag original URLs
    public readonly imageUrls: TopoImageUrls,
    public readonly dimensions: ImageDimensions,
    public readonly viewScale: ViewScale,
    public readonly sourceUrl: Url | null,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    // S3 optimized URLs (optional)
    public readonly s3ImageUrls: S3ImageUrls | null = null,
  ) {}

  /**
   * Get the best available thumbnail URL (prefer S3, fallback to TheCrag)
   */
  getThumbnailUrl(): string {
    return (
      this.s3ImageUrls?.getThumbnailUrl() ?? this.imageUrls.getThumbnailUrl()
    )
  }

  /**
   * Get the best available full image URL (prefer S3, fallback to TheCrag)
   */
  getFullImageUrl(): string {
    return (
      this.s3ImageUrls?.getFullImageUrl() ?? this.imageUrls.getFullImageUrl()
    )
  }

  /**
   * Check if S3 images are available
   */
  hasS3Images(): boolean {
    return this.s3ImageUrls !== null
  }
}
