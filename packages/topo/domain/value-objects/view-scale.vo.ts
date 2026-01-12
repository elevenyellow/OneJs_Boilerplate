/**
 * ViewScale Value Object
 * Represents the scale factor between display and original image dimensions
 */
export class ViewScale {
  private constructor(private readonly value: number) {}

  static create(scale: number): ViewScale {
    if (scale <= 0) {
      throw new Error('View scale must be positive')
    }
    return new ViewScale(scale)
  }

  static default(): ViewScale {
    return new ViewScale(1.0)
  }

  toNumber(): number {
    return this.value
  }

  equals(other: ViewScale): boolean {
    return this.value === other.value
  }
}
