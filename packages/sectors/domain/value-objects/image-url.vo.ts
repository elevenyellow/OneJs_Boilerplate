export class ImageUrl {
  private readonly headerImage: string | null
  private readonly coverImage: string | null
  private readonly thumbnail: string | null

  private constructor(
    headerImage: string | null,
    coverImage: string | null,
    thumbnail: string | null,
  ) {
    this.headerImage = headerImage
    this.coverImage = coverImage
    this.thumbnail = thumbnail
  }

  static createFrom(
    headerImage: string | null | undefined,
    coverImage?: string | null | undefined,
    thumbnail?: string | null | undefined,
  ): ImageUrl {
    return new ImageUrl(
      headerImage || null,
      coverImage || null,
      thumbnail || null,
    )
  }

  static createEmpty(): ImageUrl {
    return new ImageUrl(null, null, null)
  }

  getHeaderImage(): string | null {
    return this.headerImage
  }

  getCoverImage(): string | null {
    return this.coverImage
  }

  getThumbnail(): string | null {
    return this.thumbnail
  }

  getBestImage(): string | null {
    return this.headerImage || this.coverImage || this.thumbnail || null
  }

  hasAnyImage(): boolean {
    return (
      this.headerImage !== null ||
      this.coverImage !== null ||
      this.thumbnail !== null
    )
  }

  equals(other: ImageUrl): boolean {
    return (
      this.headerImage === other.headerImage &&
      this.coverImage === other.coverImage &&
      this.thumbnail === other.thumbnail
    )
  }

  toString(): string {
    return this.getBestImage() || ''
  }
}
