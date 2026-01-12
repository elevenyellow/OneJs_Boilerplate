import { CragId } from '@crag/domain/value-objects/crag-id.vo'
import { SectorId } from '@sector/domain/value-objects/sector-id.vo'
import { TopoImageId } from '@topo/domain/value-objects/topo-image-id.vo'

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
  areaUrl: string | null
}

/**
 * Crag topo image entity - overview topo showing sectors
 */
export class CragTopoImageEntity {
  constructor(
    public readonly id: TopoImageId,
    public readonly externalId: string,
    public readonly cragId: CragId,
    // TheCrag original URLs
    public readonly thumbnailUrl: string,
    public readonly fullImageUrl: string,
    public readonly width: number,
    public readonly height: number,
    public readonly originalWidth: number,
    public readonly originalHeight: number,
    public readonly viewScale: number,
    public readonly sourceUrl: string | null,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    // S3 optimized URLs
    public readonly thumbnailS3Url: string | null = null,
    public readonly fullImageS3Url: string | null = null,
    public readonly originalSourceUrl: string | null = null,
  ) {}

  /**
   * Get the best available thumbnail URL (prefer S3, fallback to TheCrag)
   */
  getThumbnailUrl(): string {
    return this.thumbnailS3Url ?? this.thumbnailUrl
  }

  /**
   * Get the best available full image URL (prefer S3, fallback to TheCrag)
   */
  getFullImageUrl(): string {
    return this.fullImageS3Url ?? this.fullImageUrl
  }

  /**
   * Check if S3 images are available
   */
  hasS3Images(): boolean {
    return this.thumbnailS3Url !== null && this.fullImageS3Url !== null
  }
}
