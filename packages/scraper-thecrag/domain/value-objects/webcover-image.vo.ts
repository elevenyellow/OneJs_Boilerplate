import { ImageUrl } from './image-url.vo'
import { WebCoverFocus } from './webcover-focus.vo'

/**
 * Input for creating a WebCoverImage.
 */
interface WebCoverImageCreateInput {
  imageUrl: ImageUrl
  focus?: WebCoverFocus | null
  originalWidth?: number | null
  originalHeight?: number | null
  dateUploaded?: string | null
  title?: string | null
}

/**
 * Value Object representing a web cover image for a crag/sector.
 * Combines the image URL with focus area and metadata.
 *
 * Web covers are header images used on TheCrag pages to represent
 * areas, crags, and sectors.
 */
export class WebCoverImage {
  private constructor(
    private readonly imageUrl: ImageUrl,
    private readonly focus: WebCoverFocus | null,
    private readonly originalWidth: number | null,
    private readonly originalHeight: number | null,
    private readonly dateUploaded: string | null,
    private readonly title: string | null,
  ) {}

  /**
   * Creates a WebCoverImage with all its components.
   */
  static create(input: WebCoverImageCreateInput): WebCoverImage {
    return new WebCoverImage(
      input.imageUrl,
      input.focus ?? null,
      input.originalWidth ?? null,
      input.originalHeight ?? null,
      input.dateUploaded ?? null,
      input.title ?? null,
    )
  }

  /**
   * Creates a WebCoverImage from TheCrag API response.
   * Extracts webcover data including hashId, dimensions, focus area, and metadata.
   */
  static fromApiResponse(
    apiResponse: Record<string, unknown> | null,
  ): WebCoverImage | null {
    if (!apiResponse) return null

    const data = apiResponse.data as Record<string, unknown> | undefined
    const webcover = data?.webcover as Record<string, unknown> | undefined

    if (!webcover) return null

    const hashId = webcover.hashId as string | undefined
    if (!hashId) return null

    const imageUrl = ImageUrl.fromHashId(hashId)

    const focusData = webcover.focus as Record<string, unknown> | undefined
    let focus: WebCoverFocus | null = null
    if (focusData) {
      focus = WebCoverFocus.create(
        (focusData.top as number) ?? 0,
        (focusData.bottom as number) ?? 0,
        (focusData.left as number) ?? 0,
        (focusData.right as number) ?? 0,
        (focusData.label as string) ?? '',
      )
    }

    return WebCoverImage.create({
      imageUrl,
      focus,
      originalWidth: (webcover.width as number) ?? null,
      originalHeight: (webcover.height as number) ?? null,
      dateUploaded: (webcover.dateUploaded as string) ?? null,
      title: (webcover.title as string) ?? null,
    })
  }

  getImageUrl(): ImageUrl {
    return this.imageUrl
  }

  getFocus(): WebCoverFocus | null {
    return this.focus
  }

  getOriginalWidth(): number | null {
    return this.originalWidth
  }

  getOriginalHeight(): number | null {
    return this.originalHeight
  }

  getDateUploaded(): string | null {
    return this.dateUploaded
  }

  /**
   * Returns the date uploaded as a Date object.
   */
  getDateUploadedAsDate(): Date | null {
    if (!this.dateUploaded) return null
    return new Date(this.dateUploaded)
  }

  getTitle(): string | null {
    return this.title
  }

  /**
   * Returns the aspect ratio of the original image (width / height).
   */
  getAspectRatio(): number | null {
    if (!this.originalWidth || !this.originalHeight) return null
    return this.originalWidth / this.originalHeight
  }

  /**
   * Returns the full image URL.
   */
  getFullUrl(): string {
    return this.imageUrl.getFullUrl()
  }

  /**
   * Returns a thumbnail URL of the specified size.
   */
  getThumbnail(size: number): string {
    return this.imageUrl.getSquareThumbnail(size)
  }

  /**
   * Returns a resized URL maintaining the focus area.
   */
  getResized(width: number, height: number): string {
    return this.imageUrl.getResized(width, height)
  }

  equals(other: WebCoverImage): boolean {
    return this.imageUrl.equals(other.imageUrl)
  }

  toString(): string {
    return `WebCover(${this.title}, ${this.originalWidth}x${this.originalHeight})`
  }
}
