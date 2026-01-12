import {
  BetaInfo,
  ExternalId,
  Geometry,
  Name,
  Seasonality,
  AltNames,
} from '@climb-zone/shared'
import { AreaId } from '../value-objects/area-id.vo'
import { CragId } from '@crag/domain/value-objects/crag-id.vo'

export type AreaType = 'Area' | 'Cliff'

/**
 * Area Entity - Represents an intermediate grouping within a Crag
 * Can be nested (Area > Cliff > Sector)
 * Examples: "Chulilla Town", "Pared de Enfrente"
 *
 * parentAreaId is null when the area is directly under the crag.
 * When it has a value, the area is nested inside another area.
 */
export class AreaEntity {
  constructor(
    public readonly id: AreaId,
    public readonly externalId: ExternalId,
    public readonly cragId: CragId,
    public readonly parentAreaId: AreaId | null,
    public readonly name: Name,
    public readonly altNames: AltNames,
    public readonly type: AreaType,
    public readonly geometry: Geometry | null,
    public readonly seasonality: Seasonality,
    public readonly beta: BetaInfo,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    // Header image - Original TheCrag URLs
    public readonly headerImageUrl: string | null = null,
    public readonly headerImageWidth: number | null = null,
    public readonly headerImageHeight: number | null = null,
    // Header image - Optimized S3 URLs
    public readonly headerImageS3Url: string | null = null,
    public readonly headerImageS3UrlFull: string | null = null,
    public readonly headerImageOriginalUrl: string | null = null,
  ) {}

  get latitude(): number | null {
    return this.geometry?.lat ?? null
  }

  get longitude(): number | null {
    return this.geometry?.long ?? null
  }

  isNested(): boolean {
    return this.parentAreaId !== null
  }

  isCliff(): boolean {
    return this.type === 'Cliff'
  }

  getDescription(): string | null {
    return this.beta.getDescription()
  }

  getBestMonths(): number[] {
    return this.seasonality.getBestMonths()
  }

  isGoodMonth(month: number): boolean {
    return this.seasonality.isGoodMonth(month)
  }

  hasHeaderImage(): boolean {
    return this.headerImageUrl !== null || this.headerImageS3Url !== null
  }

  /**
   * Get the best available header image URL (prefer S3, fallback to TheCrag)
   */
  getHeaderImageUrl(size: 'mobile' | 'full' = 'mobile'): string | null {
    if (size === 'full') {
      return this.headerImageS3UrlFull ?? this.headerImageUrl
    }
    return this.headerImageS3Url ?? this.headerImageUrl
  }

  /**
   * Check if S3 images are available
   */
  hasS3Images(): boolean {
    return this.headerImageS3Url !== null && this.headerImageS3UrlFull !== null
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id.toString(),
      externalId: this.externalId.toNumber(),
      cragId: this.cragId.toString(),
      parentAreaId: this.parentAreaId?.toString() ?? null,
      name: this.name.toString(),
      altNames: this.altNames.toArray(),
      type: this.type,
      latitude: this.latitude,
      longitude: this.longitude,
      geometry: this.geometry?.toJSON(),
      seasonality: this.seasonality.toArray(),
      beta: this.beta.toJSON(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      headerImageUrl: this.getHeaderImageUrl('mobile'),
      headerImageWidth: this.headerImageWidth,
      headerImageHeight: this.headerImageHeight,
      headerImageS3Url: this.headerImageS3Url,
      headerImageS3UrlFull: this.headerImageS3UrlFull,
      headerImageOriginalUrl: this.headerImageOriginalUrl,
    }
  }
}
