/**
 * Input for quality stats creation
 */
export interface QualityStatsInput {
  totalRoutes: number
  classicRoutesCount?: number
  recommendedRoutesCount?: number
  highQualityRoutesCount?: number
  averageQualityScore?: number
  averageStars?: number
}

/**
 * Serialized quality stats
 */
export interface QualityStatsPrimitives {
  totalRoutes: number
  classicRoutesCount: number
  classicRoutesPercentage: number
  recommendedRoutesCount: number
  recommendedRoutesPercentage: number
  highQualityRoutesCount: number
  highQualityPercentage: number
  averageQualityScore: number
  averageStars: number
  qualityRating: number
  hasClassics: boolean
  isHighQualitySector: boolean
}

/**
 * Thresholds for quality classification
 */
const QUALITY_THRESHOLDS = {
  HIGH_QUALITY_SCORE: 70, // Quality score >= 70 is high quality
  HIGH_QUALITY_SECTOR_PERCENTAGE: 50, // >50% high quality routes = high quality sector
  HIGH_QUALITY_SECTOR_SCORE: 65, // Average score >= 65 also qualifies
} as const

/**
 * Value object representing quality statistics for a sector or area.
 * Tracks classic routes, recommended routes, and overall quality metrics.
 */
export class QualityStats {
  private readonly totalRoutes: number
  private readonly classicRoutesCount: number
  private readonly recommendedRoutesCount: number
  private readonly highQualityRoutesCount: number
  private readonly averageQualityScore: number
  private readonly averageStars: number

  private constructor(
    totalRoutes: number,
    classicRoutesCount: number,
    recommendedRoutesCount: number,
    highQualityRoutesCount: number,
    averageQualityScore: number,
    averageStars: number,
  ) {
    this.totalRoutes = totalRoutes
    this.classicRoutesCount = classicRoutesCount
    this.recommendedRoutesCount = recommendedRoutesCount
    this.highQualityRoutesCount = highQualityRoutesCount
    this.averageQualityScore = averageQualityScore
    this.averageStars = averageStars
  }

  /**
   * Creates quality stats from input data
   */
  static createFrom(data: QualityStatsInput | null | undefined): QualityStats {
    if (!data) {
      return QualityStats.createEmpty()
    }

    return new QualityStats(
      data.totalRoutes,
      data.classicRoutesCount ?? 0,
      data.recommendedRoutesCount ?? 0,
      data.highQualityRoutesCount ?? 0,
      data.averageQualityScore ?? 0,
      data.averageStars ?? 0,
    )
  }

  /**
   * Creates empty quality stats
   */
  static createEmpty(): QualityStats {
    return new QualityStats(0, 0, 0, 0, 0, 0)
  }

  // ============================================================================
  // BASIC METRICS
  // ============================================================================

  getTotalRoutes(): number {
    return this.totalRoutes
  }

  isEmpty(): boolean {
    return this.totalRoutes === 0
  }

  // ============================================================================
  // CLASSIC ROUTES (3 STARS)
  // ============================================================================

  getClassicRoutesCount(): number {
    return this.classicRoutesCount
  }

  getClassicRoutesPercentage(): number {
    if (this.totalRoutes === 0) return 0
    return Math.round((this.classicRoutesCount / this.totalRoutes) * 100)
  }

  hasClassics(): boolean {
    return this.classicRoutesCount > 0
  }

  // ============================================================================
  // RECOMMENDED ROUTES (2+ STARS)
  // ============================================================================

  getRecommendedRoutesCount(): number {
    return this.recommendedRoutesCount
  }

  getRecommendedRoutesPercentage(): number {
    if (this.totalRoutes === 0) return 0
    return Math.round((this.recommendedRoutesCount / this.totalRoutes) * 100)
  }

  // ============================================================================
  // HIGH QUALITY ROUTES
  // ============================================================================

  getHighQualityRoutesCount(): number {
    return this.highQualityRoutesCount
  }

  getHighQualityPercentage(): number {
    if (this.totalRoutes === 0) return 0
    return Math.round((this.highQualityRoutesCount / this.totalRoutes) * 100)
  }

  // ============================================================================
  // QUALITY SCORES
  // ============================================================================

  getAverageQualityScore(): number {
    return this.averageQualityScore
  }

  getAverageStars(): number {
    return this.averageStars
  }

  /**
   * Check if this is a high quality sector
   * Based on percentage of high quality routes or average score
   */
  isHighQualitySector(): boolean {
    return (
      this.getHighQualityPercentage() >=
        QUALITY_THRESHOLDS.HIGH_QUALITY_SECTOR_PERCENTAGE ||
      this.averageQualityScore >= QUALITY_THRESHOLDS.HIGH_QUALITY_SECTOR_SCORE
    )
  }

  /**
   * Calculate quality rating on 0-3 scale (like route stars)
   * Combines multiple factors: classics, recommendations, quality score
   */
  getQualityRating(): number {
    if (this.isEmpty()) return 0

    // Weight factors:
    // - 40% from classic routes percentage (3 stars)
    // - 30% from recommended routes percentage (2+ stars)
    // - 30% from average quality score

    const classicScore = Math.min(this.getClassicRoutesPercentage() / 20, 1) // 20% classics = max score
    const recommendedScore = Math.min(
      this.getRecommendedRoutesPercentage() / 50,
      1,
    ) // 50% recommended = max
    const qualityScore = this.averageQualityScore / 100

    const weightedScore =
      classicScore * 0.4 + recommendedScore * 0.3 + qualityScore * 0.3

    // Convert to 0-3 scale (like route stars)
    return Math.round(weightedScore * 3 * 10) / 10
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  toPrimitives(): QualityStatsPrimitives {
    return {
      totalRoutes: this.totalRoutes,
      classicRoutesCount: this.classicRoutesCount,
      classicRoutesPercentage: this.getClassicRoutesPercentage(),
      recommendedRoutesCount: this.recommendedRoutesCount,
      recommendedRoutesPercentage: this.getRecommendedRoutesPercentage(),
      highQualityRoutesCount: this.highQualityRoutesCount,
      highQualityPercentage: this.getHighQualityPercentage(),
      averageQualityScore: this.averageQualityScore,
      averageStars: this.averageStars,
      qualityRating: this.getQualityRating(),
      hasClassics: this.hasClassics(),
      isHighQualitySector: this.isHighQualitySector(),
    }
  }

  // ============================================================================
  // EQUALITY
  // ============================================================================

  equals(other: QualityStats): boolean {
    return (
      this.totalRoutes === other.totalRoutes &&
      this.classicRoutesCount === other.classicRoutesCount &&
      this.recommendedRoutesCount === other.recommendedRoutesCount &&
      this.highQualityRoutesCount === other.highQualityRoutesCount &&
      this.averageQualityScore === other.averageQualityScore &&
      this.averageStars === other.averageStars
    )
  }

  toString(): string {
    return `QualityStats(classics=${this.classicRoutesCount}, rating=${this.getQualityRating()})`
  }
}
