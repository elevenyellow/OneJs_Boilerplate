/**
 * Quality Value Object
 * Represents the quality score of a route (0-100 typically)
 */
export class Quality {
  private constructor(private readonly value: number) {}

  static create(quality: number | null | undefined): Quality | null {
    if (quality === null || quality === undefined) {
      return null
    }

    const parsed =
      typeof quality === 'number' ? quality : parseFloat(String(quality))

    if (isNaN(parsed)) {
      return null
    }

    return new Quality(parsed)
  }

  toNumber(): number {
    return this.value
  }

  /**
   * Check if this is a high quality route
   */
  isHighQuality(): boolean {
    return this.value >= 80
  }

  /**
   * Get quality as a percentage string
   */
  toPercentage(): string {
    return `${Math.round(this.value)}%`
  }

  equals(other: Quality): boolean {
    return this.value === other.value
  }
}
