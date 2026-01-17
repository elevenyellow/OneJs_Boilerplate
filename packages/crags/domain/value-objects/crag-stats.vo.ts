export class CragStats {
  private readonly numberRoutes: number | null
  private readonly numberPhotos: number | null
  private readonly numberTopos: number | null
  private readonly ascentCount: number | null
  private readonly kudos: number | null // Favorites count (merged from totalFavorites)
  private readonly overallScore: number | null // 0-3 quality rating

  private constructor(
    numberRoutes: number | null,
    numberPhotos: number | null,
    numberTopos: number | null,
    ascentCount: number | null,
    kudos: number | null,
    overallScore: number | null,
  ) {
    this.numberRoutes = numberRoutes
    this.numberPhotos = numberPhotos
    this.numberTopos = numberTopos
    this.ascentCount = ascentCount
    this.kudos = kudos
    this.overallScore = overallScore
  }

  static createFrom(
    numberRoutes: number | null | undefined,
    numberPhotos: number | null | undefined,
    numberTopos: number | null | undefined,
    ascentCount: number | null | undefined,
    kudos: number | null | undefined,
    overallScore: number | null | undefined = null,
  ): CragStats {
    return new CragStats(
      numberRoutes ?? null,
      numberPhotos ?? null,
      numberTopos ?? null,
      ascentCount ?? null,
      kudos ?? null,
      overallScore ?? null,
    )
  }

  static createEmpty(): CragStats {
    return new CragStats(null, null, null, null, null, null)
  }

  getNumberRoutes(): number | null {
    return this.numberRoutes
  }

  getNumberPhotos(): number | null {
    return this.numberPhotos
  }

  getNumberTopos(): number | null {
    return this.numberTopos
  }

  getAscentCount(): number | null {
    return this.ascentCount
  }

  getKudos(): number | null {
    return this.kudos
  }

  /**
   * Get the overall quality score for the crag (0-3 scale, like route stars)
   */
  getOverallScore(): number {
    return this.overallScore ?? 0
  }

  /**
   * Get star rating based on kudos (0-3 scale)
   * Same logic as sector star rating for consistency
   */
  getStarRating(): number {
    if (this.kudos === null || this.kudos === 0) return 0
    if (this.kudos <= 10) return 1
    if (this.kudos <= 50) return 2
    return 3
  }

  /**
   * Check if overall score data is available
   */
  hasOverallScore(): boolean {
    return this.overallScore !== null
  }

  hasRoutes(): boolean {
    return this.numberRoutes !== null && this.numberRoutes > 0
  }

  equals(other: CragStats): boolean {
    return (
      this.numberRoutes === other.numberRoutes &&
      this.numberPhotos === other.numberPhotos &&
      this.numberTopos === other.numberTopos &&
      this.ascentCount === other.ascentCount &&
      this.kudos === other.kudos &&
      this.overallScore === other.overallScore
    )
  }

  toString(): string {
    return `Routes: ${this.numberRoutes}, Ascents: ${this.ascentCount}, Kudos: ${this.kudos}, Score: ${this.overallScore}`
  }
}
