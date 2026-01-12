import { Url } from '@climb-zone/shared'

/**
 * S3ImageUrls Value Object
 * Encapsulates the S3 optimized image URLs (thumbnail, full, original)
 */
export class S3ImageUrls {
  private constructor(
    private readonly _thumbnailS3Url: Url,
    private readonly _fullImageS3Url: Url,
    private readonly _originalSourceUrl: Url,
  ) {}

  static create(
    thumbnailS3Url: string,
    fullImageS3Url: string,
    originalSourceUrl: string,
  ): S3ImageUrls {
    return new S3ImageUrls(
      Url.create(thumbnailS3Url),
      Url.create(fullImageS3Url),
      Url.create(originalSourceUrl),
    )
  }

  static fromNullable(
    thumbnailS3Url: string | null,
    fullImageS3Url: string | null,
    originalSourceUrl: string | null,
  ): S3ImageUrls | null {
    if (!thumbnailS3Url || !fullImageS3Url || !originalSourceUrl) {
      return null
    }
    return S3ImageUrls.create(thumbnailS3Url, fullImageS3Url, originalSourceUrl)
  }

  get thumbnailS3Url(): Url {
    return this._thumbnailS3Url
  }

  get fullImageS3Url(): Url {
    return this._fullImageS3Url
  }

  get originalSourceUrl(): Url {
    return this._originalSourceUrl
  }

  /**
   * Get thumbnail URL as string
   */
  getThumbnailUrl(): string {
    return this._thumbnailS3Url.toString()
  }

  /**
   * Get full image URL as string
   */
  getFullImageUrl(): string {
    return this._fullImageS3Url.toString()
  }

  /**
   * Get original source URL as string
   */
  getOriginalSourceUrl(): string {
    return this._originalSourceUrl.toString()
  }

  equals(other: S3ImageUrls): boolean {
    return (
      this._thumbnailS3Url.equals(other._thumbnailS3Url) &&
      this._fullImageS3Url.equals(other._fullImageS3Url) &&
      this._originalSourceUrl.equals(other._originalSourceUrl)
    )
  }

  toJSON(): {
    thumbnailS3Url: string
    fullImageS3Url: string
    originalSourceUrl: string
  } {
    return {
      thumbnailS3Url: this._thumbnailS3Url.toString(),
      fullImageS3Url: this._fullImageS3Url.toString(),
      originalSourceUrl: this._originalSourceUrl.toString(),
    }
  }
}
