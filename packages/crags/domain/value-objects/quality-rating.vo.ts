/**
 * QualityRating Value Object
 *
 * Represents the quality rating of a crag based on route stars (0-3 scale).
 * This is calculated from the average star ratings of all routes in the crag.
 *
 * Scale:
 * - 0: No quality data or very poor
 * - 1: Below average quality (⭐)
 * - 2: Good quality (⭐⭐)
 * - 3: Excellent quality (⭐⭐⭐)
 *
 * This score is used for:
 * - Filtering crags by minimum quality
 * - Displaying quality indicators in UI
 * - Ranking crags in search results
 */
export class QualityRating {
  private static readonly MIN_RATING = 0
  private static readonly MAX_RATING = 3

  private constructor(private readonly value: number) {}

  static createFrom(value: number | null | undefined): QualityRating {
    if (value === null || value === undefined) {
      return new QualityRating(0)
    }

    // Clamp value between 0 and 3
    const clamped = Math.max(
      QualityRating.MIN_RATING,
      Math.min(QualityRating.MAX_RATING, value),
    )

    return new QualityRating(clamped)
  }

  getValue(): number {
    return this.value
  }

  /**
   * Get the rating as an integer (0-3) for display as stars
   */
  getStars(): number {
    return Math.round(this.value)
  }

  /**
   * Check if the crag has high quality (>= 2.0)
   */
  isHighQuality(): boolean {
    return this.value >= 2.0
  }

  /**
   * Check if the crag has excellent quality (>= 2.5)
   */
  isExcellent(): boolean {
    return this.value >= 2.5
  }

  /**
   * Get a label for the quality rating
   */
  getLabel(): 'none' | 'poor' | 'fair' | 'good' | 'excellent' {
    if (this.value === 0) return 'none'
    if (this.value < 1.5) return 'poor'
    if (this.value < 2.0) return 'fair'
    if (this.value < 2.5) return 'good'
    return 'excellent'
  }

  equals(other: QualityRating): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value.toFixed(1)
  }
}
