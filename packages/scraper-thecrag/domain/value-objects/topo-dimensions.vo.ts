import { ErrorCodes, OneJsError } from '@OneJs/core'

/**
 * Value Object representing the dimensions of a topo image.
 * Contains both display dimensions (as shown in the HTML) and original dimensions
 * (the full resolution image), along with the view scale factor.
 */
export class TopoDimensions {
  private constructor(
    private readonly displayWidth: number,
    private readonly displayHeight: number,
    private readonly viewScale: number,
    private readonly originalWidth: number,
    private readonly originalHeight: number,
  ) {}

  /**
   * Creates TopoDimensions with all values specified.
   */
  static create(
    displayWidth: number,
    displayHeight: number,
    viewScale: number,
    originalWidth: number,
    originalHeight: number,
  ): TopoDimensions {
    TopoDimensions.validateDimensions(
      displayWidth,
      displayHeight,
      originalWidth,
      originalHeight,
      viewScale,
    )

    return new TopoDimensions(
      displayWidth,
      displayHeight,
      viewScale,
      originalWidth,
      originalHeight,
    )
  }

  /**
   * Creates TopoDimensions from display dimensions and scale.
   * Original dimensions are calculated as display * scale.
   */
  static fromDisplayWithScale(
    displayWidth: number,
    displayHeight: number,
    viewScale: number,
  ): TopoDimensions {
    const originalWidth = displayWidth * viewScale
    const originalHeight = displayHeight * viewScale

    return TopoDimensions.create(
      displayWidth,
      displayHeight,
      viewScale,
      originalWidth,
      originalHeight,
    )
  }

  /**
   * Creates TopoDimensions from display and original dimensions.
   * View scale is calculated as original / display.
   */
  static fromDimensions(
    displayWidth: number,
    displayHeight: number,
    originalWidth: number,
    originalHeight: number,
  ): TopoDimensions {
    const viewScale = originalWidth / displayWidth

    return TopoDimensions.create(
      displayWidth,
      displayHeight,
      viewScale,
      originalWidth,
      originalHeight,
    )
  }

  private static validateDimensions(
    displayWidth: number,
    displayHeight: number,
    originalWidth: number,
    originalHeight: number,
    viewScale: number,
  ): void {
    if (displayWidth <= 0 || displayHeight <= 0) {
      throw new OneJsError(
        'Invalid dimensions',
        400,
        'Display dimensions must be positive numbers',
        { displayWidth, displayHeight },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    if (originalWidth <= 0 || originalHeight <= 0) {
      throw new OneJsError(
        'Invalid dimensions',
        400,
        'Original dimensions must be positive numbers',
        { originalWidth, originalHeight },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    if (viewScale <= 0) {
      throw new OneJsError(
        'Invalid dimensions',
        400,
        'View scale must be a positive number',
        { viewScale },
        ErrorCodes.VALIDATION_FAILED,
      )
    }
  }

  getDisplayWidth(): number {
    return this.displayWidth
  }

  getDisplayHeight(): number {
    return this.displayHeight
  }

  getViewScale(): number {
    return this.viewScale
  }

  getOriginalWidth(): number {
    return this.originalWidth
  }

  getOriginalHeight(): number {
    return this.originalHeight
  }

  /**
   * Returns the aspect ratio (width / height) of the image.
   */
  getAspectRatio(): number {
    return this.originalWidth / this.originalHeight
  }

  /**
   * Calculates the scale factor needed to fit the image within target dimensions.
   * Maintains aspect ratio.
   */
  getScaleToFit(targetWidth: number, targetHeight: number): number {
    const widthScale = targetWidth / this.displayWidth
    const heightScale = targetHeight / this.displayHeight
    return Math.min(widthScale, heightScale)
  }

  /**
   * Converts a coordinate from display space to original image space.
   */
  toOriginalCoordinate(
    displayX: number,
    displayY: number,
  ): { x: number; y: number } {
    return {
      x: displayX * this.viewScale,
      y: displayY * this.viewScale,
    }
  }

  /**
   * Converts a coordinate from original image space to display space.
   */
  toDisplayCoordinate(
    originalX: number,
    originalY: number,
  ): { x: number; y: number } {
    return {
      x: originalX / this.viewScale,
      y: originalY / this.viewScale,
    }
  }

  equals(other: TopoDimensions): boolean {
    return (
      this.displayWidth === other.displayWidth &&
      this.displayHeight === other.displayHeight &&
      this.viewScale === other.viewScale &&
      this.originalWidth === other.originalWidth &&
      this.originalHeight === other.originalHeight
    )
  }

  toString(): string {
    return `${this.displayWidth}x${this.displayHeight} (original: ${this.originalWidth}x${this.originalHeight}, scale: ${this.viewScale})`
  }
}
