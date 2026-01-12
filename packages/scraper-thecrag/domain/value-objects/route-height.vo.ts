/**
 * Value Object representing a route height in meters.
 * Handles parsing from various input formats (number, string, array).
 */
export class RouteHeight {
  private constructor(private readonly value: number) {}

  /**
   * Creates a RouteHeight with the given value in meters.
   */
  static create(valueInMeters: number): RouteHeight {
    return new RouteHeight(valueInMeters)
  }

  /**
   * Parses height from various input formats.
   * Handles: number, string, array [value, unit]
   * Returns null for invalid or missing input.
   */
  static parse(height: unknown): RouteHeight | null {
    if (height === null || height === undefined) {
      return null
    }

    // Handle array format [value, unit]
    if (Array.isArray(height)) {
      if (height.length === 0) {
        return null
      }
      const value = Number.parseFloat(String(height[0]))
      return Number.isNaN(value) ? null : new RouteHeight(value)
    }

    // Handle number
    if (typeof height === 'number') {
      return new RouteHeight(height)
    }

    // Handle string
    if (typeof height === 'string') {
      const value = Number.parseFloat(height)
      return Number.isNaN(value) ? null : new RouteHeight(value)
    }

    return null
  }

  /**
   * Returns the height value in meters.
   */
  getValue(): number {
    return this.value
  }

  equals(other: RouteHeight): boolean {
    return this.value === other.value
  }

  toString(): string {
    return `${this.value}m`
  }

  toDto(): number {
    return this.value
  }
}
