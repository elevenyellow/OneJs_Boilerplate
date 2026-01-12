/**
 * Value Object representing an image URL with associated metadata.
 * Supports thumbnail generation and URL transformations for TheCrag images.
 */
export class ImageUrl {
  private static readonly THECRAG_CDN_BASE = 'https://static.thecrag.com'

  private constructor(
    private readonly thumbnailUrl: string,
    private readonly fullUrl: string,
    private readonly hashId: string,
  ) {}

  /**
   * Creates an ImageUrl from provided URLs and hash ID.
   */
  static create(
    thumbnailUrl: string,
    fullUrl: string,
    hashId: string,
  ): ImageUrl {
    return new ImageUrl(thumbnailUrl, fullUrl, hashId)
  }

  /**
   * Creates an ImageUrl from a TheCrag image hash ID.
   * Generates both thumbnail and full URLs based on the hash.
   */
  static fromHashId(hashId: string): ImageUrl {
    const thumbnailUrl = `${ImageUrl.THECRAG_CDN_BASE}/cache/img_${hashId.substring(0, 8)}_100x100.jpg`
    const fullUrl = `${ImageUrl.THECRAG_CDN_BASE}/cids/${hashId}.jpg`

    return new ImageUrl(thumbnailUrl, fullUrl, hashId)
  }

  getThumbnailUrl(): string {
    return this.thumbnailUrl
  }

  getFullUrl(): string {
    return this.fullUrl
  }

  getHashId(): string {
    return this.hashId
  }

  /**
   * Generates a URL for the image resized to the specified dimensions.
   * Uses TheCrag's image resizing cache format.
   */
  getResized(width: number, height: number): string {
    const shortHash = this.hashId.substring(0, 8)
    return `${ImageUrl.THECRAG_CDN_BASE}/cache/img_${shortHash}_${width}x${height}.jpg`
  }

  /**
   * Generates a URL for a square thumbnail of the specified size.
   */
  getSquareThumbnail(size: number): string {
    return this.getResized(size, size)
  }

  equals(other: ImageUrl): boolean {
    return this.hashId === other.hashId
  }

  toString(): string {
    return this.fullUrl
  }

  /**
   * Normalizes an image URL from TheCrag.
   * Handles protocol-relative URLs (//...) and relative URLs (/...).
   */
  static normalize(url: string): string {
    if (!url) return ''
    if (url.startsWith('//')) return `https:${url}`
    if (url.startsWith('/')) return 'https://www.thecrag.com' + url
    return url
  }
}
