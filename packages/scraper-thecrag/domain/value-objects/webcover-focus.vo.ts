/**
 * Value Object representing the focus/crop area of a web cover image.
 * Contains coordinates defining the bounding box of the main content
 * within the full image.
 */
export class WebCoverFocus {
  private constructor(
    private readonly top: number,
    private readonly bottom: number,
    private readonly left: number,
    private readonly right: number,
    private readonly label: string,
  ) {}

  /**
   * Creates a WebCoverFocus with the specified crop coordinates.
   */
  static create(
    top: number,
    bottom: number,
    left: number,
    right: number,
    label: string,
  ): WebCoverFocus {
    return new WebCoverFocus(top, bottom, left, right, label)
  }

  getTop(): number {
    return this.top
  }

  getBottom(): number {
    return this.bottom
  }

  getLeft(): number {
    return this.left
  }

  getRight(): number {
    return this.right
  }

  getLabel(): string {
    return this.label
  }

  /**
   * Returns the width of the focus area.
   */
  getWidth(): number {
    return this.right - this.left
  }

  /**
   * Returns the height of the focus area.
   */
  getHeight(): number {
    return this.bottom - this.top
  }

  /**
   * Returns the center point of the focus area.
   */
  getCenter(): { x: number; y: number } {
    return {
      x: this.left + this.getWidth() / 2,
      y: this.top + this.getHeight() / 2,
    }
  }

  /**
   * Returns the aspect ratio of the focus area (width / height).
   */
  getAspectRatio(): number {
    return this.getWidth() / this.getHeight()
  }

  /**
   * Returns true if the given point is within the focus area.
   */
  containsPoint(x: number, y: number): boolean {
    return (
      x >= this.left && x <= this.right && y >= this.top && y <= this.bottom
    )
  }

  equals(other: WebCoverFocus): boolean {
    return (
      this.top === other.top &&
      this.bottom === other.bottom &&
      this.left === other.left &&
      this.right === other.right
    )
  }

  toString(): string {
    return `Focus(${this.left},${this.top} - ${this.right},${this.bottom})`
  }
}
