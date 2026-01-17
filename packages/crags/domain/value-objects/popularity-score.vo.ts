/**
 * PopularityScore Value Object
 *
 * Represents the popularity score of a crag based on ascent counts (0-3 scale).
 * This is calculated from the total number of ascents across all routes in the crag.
 *
 * Scale:
 * - 0: No ascent data or very unpopular
 * - 1: Below average popularity
 * - 2: Popular
 * - 3: Very popular
 *
 * This score is used for:
 * - Ranking crags in search results
 * - Displaying popularity indicators in UI
 * - Understanding crag traffic and trends
 */
export class PopularityScore {
  private static readonly MIN_SCORE = 0
  private static readonly MAX_SCORE = 3

  private constructor(private readonly value: number) {}

  static createFrom(value: number | null | undefined): PopularityScore {
    if (value === null || value === undefined) {
      return new PopularityScore(0)
    }

    // Clamp value between 0 and 3
    const clamped = Math.max(
      PopularityScore.MIN_SCORE,
      Math.min(PopularityScore.MAX_SCORE, value),
    )

    return new PopularityScore(clamped)
  }

  getValue(): number {
    return this.value
  }

  /**
   * Get the score as an integer (0-3) for display
   */
  getRounded(): number {
    return Math.round(this.value)
  }

  /**
   * Check if the crag is popular (>= 2.0)
   */
  isPopular(): boolean {
    return this.value >= 2.0
  }

  /**
   * Check if the crag is very popular (>= 2.5)
   */
  isVeryPopular(): boolean {
    return this.value >= 2.5
  }

  /**
   * Get a label for the popularity score
   */
  getLabel(): 'none' | 'low' | 'moderate' | 'popular' | 'very-popular' {
    if (this.value === 0) return 'none'
    if (this.value < 1.5) return 'low'
    if (this.value < 2.0) return 'moderate'
    if (this.value < 2.5) return 'popular'
    return 'very-popular'
  }

  equals(other: PopularityScore): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value.toFixed(1)
  }
}
