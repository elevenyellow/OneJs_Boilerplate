import { Url } from '@climb-zone/shared'

/**
 * TopoImageUrls Value Object
 * Encapsulates the TheCrag original image URLs (thumbnail and full)
 */
export class TopoImageUrls {
  private constructor(
    private readonly _thumbnailUrl: Url,
    private readonly _fullImageUrl: Url,
  ) {}

  static create(thumbnailUrl: string, fullImageUrl: string): TopoImageUrls {
    return new TopoImageUrls(Url.create(thumbnailUrl), Url.create(fullImageUrl))
  }

  get thumbnailUrl(): Url {
    return this._thumbnailUrl
  }

  get fullImageUrl(): Url {
    return this._fullImageUrl
  }

  /**
   * Get thumbnail URL as string
   */
  getThumbnailUrl(): string {
    return this._thumbnailUrl.toString()
  }

  /**
   * Get full image URL as string
   */
  getFullImageUrl(): string {
    return this._fullImageUrl.toString()
  }

  /**
   * Get high-resolution URL by modifying the full image URL
   * TheCrag image URLs can be modified to get different sizes
   * Format: /file/{hash}/{size}/{filename}
   */
  getHighResUrl(): string {
    return this._fullImageUrl.toString().replace(/\/\d+x\d+\//, '/1920x1920/')
  }

  equals(other: TopoImageUrls): boolean {
    return (
      this._thumbnailUrl.equals(other._thumbnailUrl) &&
      this._fullImageUrl.equals(other._fullImageUrl)
    )
  }

  toJSON(): { thumbnailUrl: string; fullImageUrl: string } {
    return {
      thumbnailUrl: this._thumbnailUrl.toString(),
      fullImageUrl: this._fullImageUrl.toString(),
    }
  }
}
