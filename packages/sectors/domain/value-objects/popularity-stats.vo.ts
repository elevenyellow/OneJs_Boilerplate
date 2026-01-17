/**
 * Most climbed route information
 */
export interface MostClimbedRoute {
  name: string
  ascents: number
}

/**
 * Input for popularity stats creation
 */
export interface PopularityStatsInput {
  totalRoutes: number
  totalAscents?: number
  popularRoutesCount?: number
  veryPopularRoutesCount?: number
  averageAscentsPerRoute?: number
  mostClimbedRoute?: MostClimbedRoute | null
}

/**
 * Serialized popularity stats
 */
export interface PopularityStatsPrimitives {
  totalRoutes: number
  totalAscents: number
  popularRoutesCount: number
  popularRoutesPercentage: number
  veryPopularRoutesCount: number
  veryPopularRoutesPercentage: number
  averageAscentsPerRoute: number
  popularityScore: number
  isPopularSector: boolean
  mostClimbedRouteName: string | null
  mostClimbedRouteAscents: number | null
}

/**
 * Thresholds for popularity classification
 */
const POPULARITY_THRESHOLDS = {
  POPULAR_ROUTE_ASCENTS: 50, // 50+ ascents = popular route
  VERY_POPULAR_ROUTE_ASCENTS: 100, // 100+ ascents = very popular route
  POPULAR_SECTOR_PERCENTAGE: 30, // >30% popular routes = popular sector
  POPULAR_SECTOR_AVERAGE_ASCENTS: 50, // Average 50+ ascents = popular sector
} as const

/**
 * Value object representing popularity statistics for a sector or area.
 * Tracks ascent counts, popular routes, and engagement metrics.
 */
export class PopularityStats {
  private readonly totalRoutes: number
  private readonly totalAscents: number
  private readonly popularRoutesCount: number
  private readonly veryPopularRoutesCount: number
  private readonly averageAscentsPerRoute: number
  private readonly mostClimbedRoute: MostClimbedRoute | null

  private constructor(
    totalRoutes: number,
    totalAscents: number,
    popularRoutesCount: number,
    veryPopularRoutesCount: number,
    averageAscentsPerRoute: number,
    mostClimbedRoute: MostClimbedRoute | null,
  ) {
    this.totalRoutes = totalRoutes
    this.totalAscents = totalAscents
    this.popularRoutesCount = popularRoutesCount
    this.veryPopularRoutesCount = veryPopularRoutesCount
    this.averageAscentsPerRoute = averageAscentsPerRoute
    this.mostClimbedRoute = mostClimbedRoute
  }

  /**
   * Creates popularity stats from input data
   */
  static createFrom(
    data: PopularityStatsInput | null | undefined,
  ): PopularityStats {
    if (!data) {
      return PopularityStats.createEmpty()
    }

    return new PopularityStats(
      data.totalRoutes,
      data.totalAscents ?? 0,
      data.popularRoutesCount ?? 0,
      data.veryPopularRoutesCount ?? 0,
      data.averageAscentsPerRoute ?? 0,
      data.mostClimbedRoute ?? null,
    )
  }

  /**
   * Creates empty popularity stats
   */
  static createEmpty(): PopularityStats {
    return new PopularityStats(0, 0, 0, 0, 0, null)
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

  getTotalAscents(): number {
    return this.totalAscents
  }

  getAverageAscentsPerRoute(): number {
    return this.averageAscentsPerRoute
  }

  // ============================================================================
  // POPULAR ROUTES
  // ============================================================================

  getPopularRoutesCount(): number {
    return this.popularRoutesCount
  }

  getPopularRoutesPercentage(): number {
    if (this.totalRoutes === 0) return 0
    return Math.round((this.popularRoutesCount / this.totalRoutes) * 100)
  }

  getVeryPopularRoutesCount(): number {
    return this.veryPopularRoutesCount
  }

  getVeryPopularRoutesPercentage(): number {
    if (this.totalRoutes === 0) return 0
    return Math.round((this.veryPopularRoutesCount / this.totalRoutes) * 100)
  }

  // ============================================================================
  // MOST CLIMBED ROUTE
  // ============================================================================

  getMostClimbedRoute(): MostClimbedRoute | null {
    return this.mostClimbedRoute
  }

  // ============================================================================
  // POPULARITY ANALYSIS
  // ============================================================================

  /**
   * Calculate overall popularity score (0-3, like route stars)
   * Combines multiple factors: ascent counts, popular route percentage
   */
  getPopularityScore(): number {
    if (this.isEmpty()) return 0

    // Weight factors:
    // - 40% from popular routes percentage
    // - 40% from average ascents (normalized)
    // - 20% from very popular routes percentage

    const popularScore = Math.min(this.getPopularRoutesPercentage() / 50, 1) // 50% = max
    const avgAscentsScore = Math.min(this.averageAscentsPerRoute / 100, 1) // 100 avg = max
    const veryPopularScore = Math.min(
      this.getVeryPopularRoutesPercentage() / 20,
      1,
    ) // 20% = max

    const weightedScore =
      popularScore * 0.4 + avgAscentsScore * 0.4 + veryPopularScore * 0.2

    // Return on 0-3 scale (like route stars)
    return Math.round(weightedScore * 3 * 10) / 10
  }

  /**
   * Check if this is a popular sector
   */
  isPopularSector(): boolean {
    return (
      this.getPopularRoutesPercentage() >=
        POPULARITY_THRESHOLDS.POPULAR_SECTOR_PERCENTAGE ||
      this.averageAscentsPerRoute >=
        POPULARITY_THRESHOLDS.POPULAR_SECTOR_AVERAGE_ASCENTS
    )
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  toPrimitives(): PopularityStatsPrimitives {
    return {
      totalRoutes: this.totalRoutes,
      totalAscents: this.totalAscents,
      popularRoutesCount: this.popularRoutesCount,
      popularRoutesPercentage: this.getPopularRoutesPercentage(),
      veryPopularRoutesCount: this.veryPopularRoutesCount,
      veryPopularRoutesPercentage: this.getVeryPopularRoutesPercentage(),
      averageAscentsPerRoute: this.averageAscentsPerRoute,
      popularityScore: this.getPopularityScore(),
      isPopularSector: this.isPopularSector(),
      mostClimbedRouteName: this.mostClimbedRoute?.name ?? null,
      mostClimbedRouteAscents: this.mostClimbedRoute?.ascents ?? null,
    }
  }

  // ============================================================================
  // EQUALITY
  // ============================================================================

  equals(other: PopularityStats): boolean {
    return (
      this.totalRoutes === other.totalRoutes &&
      this.totalAscents === other.totalAscents &&
      this.popularRoutesCount === other.popularRoutesCount &&
      this.veryPopularRoutesCount === other.veryPopularRoutesCount &&
      this.averageAscentsPerRoute === other.averageAscentsPerRoute
    )
  }

  toString(): string {
    return `PopularityStats(ascents=${this.totalAscents}, score=${this.getPopularityScore()})`
  }
}
