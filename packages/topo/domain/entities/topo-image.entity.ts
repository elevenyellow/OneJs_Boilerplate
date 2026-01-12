import { ExternalId, Url } from '@climb-zone/shared'
import { SectorId } from '@sector/domain/value-objects/sector-id.vo'
import { ImageDimensions } from '../value-objects/image-dimensions.vo'
import { S3ImageUrls } from '../value-objects/s3-image-urls.vo'
import { TopoImageId } from '../value-objects/topo-image-id.vo'
import { TopoImageUrls } from '../value-objects/topo-image-urls.vo'
import { ViewScale } from '../value-objects/view-scale.vo'

/**
 * TopoImage Entity - Represents a photo topo with route lines
 */
export class TopoImageEntity {
  constructor(
    public readonly id: TopoImageId,
    public readonly externalId: ExternalId,
    public readonly sectorId: SectorId,
    // TheCrag original URLs
    public readonly imageUrls: TopoImageUrls,
    public readonly dimensions: ImageDimensions,
    public readonly viewScale: ViewScale,
    public readonly sourceUrl: Url | null = null,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    // S3 optimized URLs (optional)
    public readonly s3ImageUrls: S3ImageUrls | null = null,
  ) {}

  /**
   * Get the high-resolution image URL
   */
  getHighResUrl(): string {
    return this.imageUrls.getHighResUrl()
  }

  /**
   * Calculate aspect ratio
   */
  getAspectRatio(): number {
    return this.dimensions.getAspectRatio()
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id.toString(),
      externalId: this.externalId.toString(),
      sectorId: this.sectorId.toString(),
      thumbnailUrl: this.imageUrls.getThumbnailUrl(),
      fullImageUrl: this.imageUrls.getFullImageUrl(),
      width: this.dimensions.width,
      height: this.dimensions.height,
      originalWidth: this.dimensions.originalWidth,
      originalHeight: this.dimensions.originalHeight,
      viewScale: this.viewScale.toNumber(),
      sourceUrl: this.sourceUrl?.toString() ?? null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      thumbnailS3Url: this.s3ImageUrls?.getThumbnailUrl() ?? null,
      fullImageS3Url: this.s3ImageUrls?.getFullImageUrl() ?? null,
      originalSourceUrl: this.s3ImageUrls?.getOriginalSourceUrl() ?? null,
    }
  }

  /**
   * Get the best available thumbnail URL (prefer S3, fallback to TheCrag)
   */
  getThumbnailUrl(): string {
    return this.s3ImageUrls?.getThumbnailUrl() ?? this.imageUrls.getThumbnailUrl()
  }

  /**
   * Get the best available full image URL (prefer S3, fallback to TheCrag)
   */
  getFullImageUrl(): string {
    return this.s3ImageUrls?.getFullImageUrl() ?? this.imageUrls.getFullImageUrl()
  }

  /**
   * Check if S3 images are available
   */
  hasS3Images(): boolean {
    return this.s3ImageUrls !== null
  }
}
