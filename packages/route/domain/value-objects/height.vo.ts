/**
 * Height Value Object
 * Represents the height of a climbing route in meters
 */
export class Height {
  private constructor(private readonly value: number) {}

  static create(height: number | null | undefined): Height | null {
    if (height === null || height === undefined) {
      return null
    }

    const parsed =
      typeof height === 'number' ? height : parseFloat(String(height))

    if (isNaN(parsed)) {
      return null
    }

    if (parsed < 0) {
      throw new Error('Height cannot be negative')
    }

    if (parsed > 8000) {
      throw new Error('Height seems unrealistic (max 8000m)')
    }

    return new Height(parsed)
  }

  toNumber(): number {
    return this.value
  }

  toString(): string {
    return `${this.value}m`
  }

  equals(other: Height): boolean {
    return this.value === other.value
  }

  /**
   * Check if this is a multi-pitch route (typically > 50m)
   */
  isMultiPitch(): boolean {
    return this.value > 50
  }
}
