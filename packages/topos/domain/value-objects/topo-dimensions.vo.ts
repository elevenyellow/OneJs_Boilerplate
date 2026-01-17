export class TopoDimensions {
  private readonly width: number
  private readonly height: number
  private readonly originalWidth: number
  private readonly originalHeight: number

  private constructor(
    width: number,
    height: number,
    originalWidth: number,
    originalHeight: number,
  ) {
    this.width = width
    this.height = height
    this.originalWidth = originalWidth
    this.originalHeight = originalHeight
  }

  static createFrom(
    width: number,
    height: number,
    originalWidth: number,
    originalHeight: number,
  ): TopoDimensions {
    return new TopoDimensions(width, height, originalWidth, originalHeight)
  }

  getWidth(): number {
    return this.width
  }

  getHeight(): number {
    return this.height
  }

  getOriginalWidth(): number {
    return this.originalWidth
  }

  getOriginalHeight(): number {
    return this.originalHeight
  }

  getAspectRatio(): number {
    if (this.height === 0) return 0
    return this.width / this.height
  }

  getScale(): number {
    if (this.originalWidth === 0) return 1
    return this.width / this.originalWidth
  }

  isLandscape(): boolean {
    return this.width > this.height
  }

  isPortrait(): boolean {
    return this.height > this.width
  }

  equals(other: TopoDimensions): boolean {
    return (
      this.width === other.width &&
      this.height === other.height &&
      this.originalWidth === other.originalWidth &&
      this.originalHeight === other.originalHeight
    )
  }

  toString(): string {
    return `${this.width}x${this.height} (original: ${this.originalWidth}x${this.originalHeight})`
  }
}
