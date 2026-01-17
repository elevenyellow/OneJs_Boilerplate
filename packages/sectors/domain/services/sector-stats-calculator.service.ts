import {
  AudienceProfile,
  ComprehensiveSectorStats,
  EquipmentStats,
  GradeDistributionStats,
  HeightStats,
  PopularityStats,
  QualityStats,
  SeasonalityStats,
  StyleDistribution,
} from '../value-objects'

/**
 * Route data needed for stats calculation
 * This is a subset of Route entity data focused on statistics
 */
export interface RouteStatsData {
  gradeBand: number
  stars: number | null
  ascents: number | null
  popularity: number | null
  height: number | null
  pitches: number | null
  bolts: number | null
  hasTopo: boolean
  isSport: boolean
  isTrad: boolean
  isBoulder: boolean
  isAid: boolean
  isAlpine: boolean
  isMixed: boolean
  isIce: boolean
  isTopRope: boolean
  name?: string
}

/**
 * Difficulty thresholds for grade band classification
 */
const GRADE_THRESHOLDS = {
  BEGINNER_MAX: 22,
  INTERMEDIATE_MAX: 34,
  ADVANCED_MAX: 44,
} as const

/**
 * Popularity thresholds
 */
const POPULARITY_THRESHOLDS = {
  POPULAR: 50,
  VERY_POPULAR: 100,
} as const

/**
 * Quality thresholds
 */
const QUALITY_THRESHOLDS = {
  HIGH_QUALITY_SCORE: 70,
  CLASSIC_STARS: 3,
  RECOMMENDED_STARS: 2,
} as const

/**
 * Domain service for calculating comprehensive sector statistics from route data.
 * This is a pure function service with no dependencies - follows DDD domain service pattern.
 */
export class SectorStatsCalculatorService {
  /**
   * Calculate comprehensive sector statistics from an array of routes
   */
  static calculateFromRoutes(
    routes: RouteStatsData[],
  ): ComprehensiveSectorStats {
    if (routes.length === 0) {
      return ComprehensiveSectorStats.createEmpty()
    }

    return ComprehensiveSectorStats.createFrom({
      gradeDistribution: this.calculateGradeDistribution(routes),
      styleDistribution: this.calculateStyleDistribution(routes),
      quality: this.calculateQualityStats(routes),
      popularity: this.calculatePopularityStats(routes),
      height: this.calculateHeightStats(routes),
      equipment: this.calculateEquipmentStats(routes),
      seasonality: SeasonalityStats.createEmpty(), // Seasonality comes from sector, not routes
      audience: this.calculateAudienceProfile(routes),
    })
  }

  /**
   * Calculate grade distribution from routes
   */
  private static calculateGradeDistribution(
    routes: RouteStatsData[],
  ): GradeDistributionStats {
    // Create grade bands array (indices 0-52+)
    const gbRoutes = new Array(53).fill(0)

    for (const route of routes) {
      const index = Math.min(Math.max(route.gradeBand, 0), 52)
      gbRoutes[index]++
    }

    return GradeDistributionStats.createFrom(gbRoutes)
  }

  /**
   * Calculate style distribution from routes
   */
  private static calculateStyleDistribution(
    routes: RouteStatsData[],
  ): StyleDistribution {
    let sport = 0
    let trad = 0
    let boulder = 0
    let aid = 0
    let alpine = 0
    let mixed = 0
    let ice = 0
    let topRope = 0

    for (const route of routes) {
      if (route.isSport) sport++
      if (route.isTrad) trad++
      if (route.isBoulder) boulder++
      if (route.isAid) aid++
      if (route.isAlpine) alpine++
      if (route.isMixed) mixed++
      if (route.isIce) ice++
      if (route.isTopRope) topRope++
    }

    return StyleDistribution.createFrom({
      sport,
      trad,
      boulder,
      aid,
      alpine,
      mixed,
      ice,
      topRope,
    })
  }

  /**
   * Calculate quality statistics from routes
   */
  private static calculateQualityStats(routes: RouteStatsData[]): QualityStats {
    let classicCount = 0
    let recommendedCount = 0
    let highQualityCount = 0
    let totalStars = 0
    let routesWithStars = 0

    for (const route of routes) {
      // Classic routes (3 stars)
      if (
        route.stars !== null &&
        route.stars >= QUALITY_THRESHOLDS.CLASSIC_STARS
      ) {
        classicCount++
      }

      // Recommended routes (2+ stars)
      if (
        route.stars !== null &&
        route.stars >= QUALITY_THRESHOLDS.RECOMMENDED_STARS
      ) {
        recommendedCount++
      }

      // High quality routes (2+ stars, same as recommended)
      if (
        route.stars !== null &&
        route.stars >= QUALITY_THRESHOLDS.RECOMMENDED_STARS
      ) {
        highQualityCount++
      }

      // Accumulate for averages
      if (route.stars !== null) {
        totalStars += route.stars
        routesWithStars++
      }
    }

    const averageStars = routesWithStars > 0 ? totalStars / routesWithStars : 0
    // Derive quality score from stars (0-100 scale: 0 stars = 0, 3 stars = 100)
    const averageQualityScore =
      routesWithStars > 0 ? (averageStars / 3) * 100 : 0

    return QualityStats.createFrom({
      totalRoutes: routes.length,
      classicRoutesCount: classicCount,
      recommendedRoutesCount: recommendedCount,
      highQualityRoutesCount: highQualityCount,
      averageQualityScore: Math.round(averageQualityScore * 10) / 10,
      averageStars: Math.round(averageStars * 10) / 10,
    })
  }

  /**
   * Calculate popularity statistics from routes
   */
  private static calculatePopularityStats(
    routes: RouteStatsData[],
  ): PopularityStats {
    let totalAscents = 0
    let popularCount = 0
    let veryPopularCount = 0
    let routesWithAscents = 0
    let mostClimbedRoute: { name: string; ascents: number } | null = null

    for (const route of routes) {
      const ascents = route.ascents ?? 0
      totalAscents += ascents

      if (ascents >= POPULARITY_THRESHOLDS.POPULAR) {
        popularCount++
      }

      if (ascents >= POPULARITY_THRESHOLDS.VERY_POPULAR) {
        veryPopularCount++
      }

      if (ascents > 0) {
        routesWithAscents++
      }

      // Track most climbed
      if (route.name && ascents > (mostClimbedRoute?.ascents ?? 0)) {
        mostClimbedRoute = { name: route.name, ascents }
      }
    }

    const averageAscents =
      routesWithAscents > 0 ? totalAscents / routesWithAscents : 0

    return PopularityStats.createFrom({
      totalRoutes: routes.length,
      totalAscents,
      popularRoutesCount: popularCount,
      veryPopularRoutesCount: veryPopularCount,
      averageAscentsPerRoute: Math.round(averageAscents),
      mostClimbedRoute,
    })
  }

  /**
   * Calculate height and pitch statistics from routes
   */
  private static calculateHeightStats(routes: RouteStatsData[]): HeightStats {
    let totalHeight = 0
    let routesWithHeight = 0
    let maxHeight = 0
    let multiPitchCount = 0
    let singlePitchCount = 0
    let totalPitches = 0
    let routesWithPitches = 0

    for (const route of routes) {
      // Height calculations
      if (route.height !== null && route.height > 0) {
        totalHeight += route.height
        routesWithHeight++
        maxHeight = Math.max(maxHeight, route.height)
      }

      // Pitch calculations
      const pitches = route.pitches ?? 1
      if (pitches > 1) {
        multiPitchCount++
      } else {
        singlePitchCount++
      }

      if (route.pitches !== null) {
        totalPitches += route.pitches
        routesWithPitches++
      }
    }

    const averageHeight =
      routesWithHeight > 0 ? totalHeight / routesWithHeight : 0
    const averagePitches =
      routesWithPitches > 0 ? totalPitches / routesWithPitches : 1

    return HeightStats.createFrom({
      totalRoutes: routes.length,
      averageHeight: Math.round(averageHeight * 10) / 10,
      averageHeightUnit: 'm',
      maxHeight,
      totalClimbableMeters: Math.round(totalHeight),
      multiPitchCount,
      singlePitchCount,
      averagePitches: Math.round(averagePitches * 10) / 10,
    })
  }

  /**
   * Calculate equipment and documentation statistics from routes
   */
  private static calculateEquipmentStats(
    routes: RouteStatsData[],
  ): EquipmentStats {
    let totalBolts = 0
    let routesWithBolts = 0
    let maxBolts = 0
    let routesWithTopo = 0
    let wellEquippedCount = 0

    for (const route of routes) {
      // Bolt calculations
      if (route.bolts !== null && route.bolts > 0) {
        totalBolts += route.bolts
        routesWithBolts++
        maxBolts = Math.max(maxBolts, route.bolts)

        // Well equipped = 6+ bolts for sport routes
        if (route.isSport && route.bolts >= 6) {
          wellEquippedCount++
        }
      }

      // Topo count
      if (route.hasTopo) {
        routesWithTopo++
      }
    }

    const averageBolts = routesWithBolts > 0 ? totalBolts / routesWithBolts : 0

    return EquipmentStats.createFrom({
      totalRoutes: routes.length,
      averageBolts: Math.round(averageBolts),
      maxBolts,
      routesWithTopoCount: routesWithTopo,
      wellEquippedRoutesCount: wellEquippedCount,
    })
  }

  /**
   * Calculate audience profile from grade distribution
   */
  private static calculateAudienceProfile(
    routes: RouteStatsData[],
  ): AudienceProfile {
    let beginnerCount = 0
    let intermediateCount = 0
    let advancedCount = 0
    let eliteCount = 0

    for (const route of routes) {
      const gradeBand = route.gradeBand

      if (gradeBand <= GRADE_THRESHOLDS.BEGINNER_MAX) {
        beginnerCount++
      } else if (gradeBand <= GRADE_THRESHOLDS.INTERMEDIATE_MAX) {
        intermediateCount++
      } else if (gradeBand <= GRADE_THRESHOLDS.ADVANCED_MAX) {
        advancedCount++
      } else {
        eliteCount++
      }
    }

    const total = routes.length
    const beginnerPercentage =
      total > 0 ? Math.round((beginnerCount / total) * 100) : 0
    const intermediatePercentage =
      total > 0 ? Math.round((intermediateCount / total) * 100) : 0
    const advancedPercentage =
      total > 0 ? Math.round((advancedCount / total) * 100) : 0
    const elitePercentage =
      total > 0 ? Math.round((eliteCount / total) * 100) : 0

    // Family friendly if many beginner routes and no dangerous styles
    const isFamilyFriendly = beginnerPercentage >= 40

    return AudienceProfile.createFrom({
      beginnerPercentage,
      intermediatePercentage,
      advancedPercentage,
      elitePercentage,
      isFamilyFriendly,
    })
  }
}
