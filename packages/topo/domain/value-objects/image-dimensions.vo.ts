/**
 * ImageDimensions Value Object
 * Encapsulates image dimensions (display and original sizes)
 */
export class ImageDimensions {
  private constructor(
    private readonly _width: number,
    private readonly _height: number,
    private readonly _originalWidth: number,
    private readonly _originalHeight: number,
  ) {}

  static create(
    width: number,
    height: number,
    originalWidth: number,
    originalHeight: number,
  ): ImageDimensions {
    if (width <= 0 || height <= 0) {
      throw new Error('Display dimensions must be positive')
    }
    if (originalWidth <= 0 || originalHeight <= 0) {
      throw new Error('Original dimensions must be positive')
    }
    return new ImageDimensions(width, height, originalWidth, originalHeight)
  }

  get width(): number {
    return this._width
  }

  get height(): number {
    return this._height
  }

  get originalWidth(): number {
    return this._originalWidth
  }

  get originalHeight(): number {
    return this._originalHeight
  }

  /**
   * Calculate aspect ratio based on original dimensions
   */
  getAspectRatio(): number {
    return this._originalWidth / this._originalHeight
  }

  /**
   * Calculate the view scale (ratio between display and original)
   */
  getViewScale(): number {
    return this._width / this._originalWidth
  }

  equals(other: ImageDimensions): boolean {
    return (
      this._width === other._width &&
      this._height === other._height &&
      this._originalWidth === other._originalWidth &&
      this._originalHeight === other._originalHeight
    )
  }

  toJSON(): {
    width: number
    height: number
    originalWidth: number
    originalHeight: number
  } {
    return {
      width: this._width,
      height: this._height,
      originalWidth: this._originalWidth,
      originalHeight: this._originalHeight,
    }
  }
}
