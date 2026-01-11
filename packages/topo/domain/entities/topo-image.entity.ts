import { TopoImageId } from '../value-objects/topo-image-id.vo'
import { SectorId } from '@sector/domain/value-objects/sector-id.vo'

/**
 * TopoImage Entity - Represents a photo topo with route lines
 */
export class TopoImageEntity {
  constructor(
    public readonly id: TopoImageId,
    public readonly externalId: string,
    public readonly sectorId: SectorId,
    public readonly thumbnailUrl: string,
    public readonly fullImageUrl: string,
    public readonly width: number,
    public readonly height: number,
    public readonly originalWidth: number,
    public readonly originalHeight: number,
    public readonly viewScale: number = 1.0,
    public readonly sourceUrl: string | null = null,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  /**
   * Get the high-resolution image URL
   */
  getHighResUrl(): string {
    // TheCrag image URLs can be modified to get different sizes
    // Format: /file/{hash}/{size}/{filename}
    // We want max size, which is usually available by removing size restrictions
    return this.fullImageUrl.replace(/\/\d+x\d+\//, '/1920x1920/')
  }

  /**
   * Calculate aspect ratio
   */
  getAspectRatio(): number {
    return this.originalWidth / this.originalHeight
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id.toString(),
      externalId: this.externalId,
      sectorId: this.sectorId.toString(),
      thumbnailUrl: this.thumbnailUrl,
      fullImageUrl: this.fullImageUrl,
      width: this.width,
      height: this.height,
      originalWidth: this.originalWidth,
      originalHeight: this.originalHeight,
      viewScale: this.viewScale,
      sourceUrl: this.sourceUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
