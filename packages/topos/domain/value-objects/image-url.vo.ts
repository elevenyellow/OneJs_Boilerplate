export class ImageUrl {
  private readonly thumbnailUrl: string
  private readonly fullImageUrl: string

  private constructor(thumbnailUrl: string, fullImageUrl: string) {
    this.thumbnailUrl = thumbnailUrl
    this.fullImageUrl = fullImageUrl
  }

  static createFrom(thumbnailUrl: string, fullImageUrl: string): ImageUrl {
    return new ImageUrl(thumbnailUrl, fullImageUrl)
  }

  getThumbnailUrl(): string {
    return this.thumbnailUrl
  }

  getFullImageUrl(): string {
    return this.fullImageUrl
  }

  getBestUrl(): string {
    return this.fullImageUrl || this.thumbnailUrl
  }

  isTheCragImage(): boolean {
    return (
      this.fullImageUrl.includes('image.thecrag.com') ||
      this.thumbnailUrl.includes('image.thecrag.com')
    )
  }

  equals(other: ImageUrl): boolean {
    return (
      this.thumbnailUrl === other.thumbnailUrl &&
      this.fullImageUrl === other.fullImageUrl
    )
  }

  toString(): string {
    return this.fullImageUrl
  }
}
