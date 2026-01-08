/**
 * Rating Value Object
 * Represents the star rating of a route (0-3 stars)
 */
export class Rating {
  private static readonly MIN = 0
  private static readonly MAX = 3

  private constructor(private readonly stars: number) {}

  static create(stars: number | null | undefined): Rating | null {
    if (stars === null || stars === undefined) {
      return null
    }

    const parsed =
      typeof stars === 'number' ? stars : parseInt(String(stars), 10)

    if (isNaN(parsed)) {
      return null
    }

    // Clamp to valid range
    const clamped = Math.max(Rating.MIN, Math.min(Rating.MAX, parsed))

    return new Rating(clamped)
  }

  toNumber(): number {
    return this.stars
  }

  /**
   * Check if this is a classic route (3 stars)
   */
  isClassic(): boolean {
    return this.stars === 3
  }

  /**
   * Check if this is a recommended route (2+ stars)
   */
  isRecommended(): boolean {
    return this.stars >= 2
  }

  toString(): string {
    return '★'.repeat(this.stars) + '☆'.repeat(Rating.MAX - this.stars)
  }

  equals(other: Rating): boolean {
    return this.stars === other.stars
  }
}
