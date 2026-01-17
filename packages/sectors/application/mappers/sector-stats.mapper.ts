import type { ComprehensiveSectorStatsPrimitives } from '../../domain/value-objects'
import { SectorStatsCalculatorService } from '../../domain/services/sector-stats-calculator.service'
import type { RouteStatsData } from '../../domain/services/sector-stats-calculator.service'
import {
  GradeDistributionStats,
  SeasonalityStats,
} from '../../domain/value-objects'
import { ClimbingStyle } from '@routes/domain/value-objects'

/**
 * Route data from database for stats calculation
 */
export interface RouteDataForStats {
  gradeBand: number | null
  stars: number | null
  ascents: number | null
  popularity: number | null
  height: number | null
  pitches: number | null
  bolts: number | null
  hasTopo: boolean
  styleFlags: number
  name?: string | null
}

/**
 * Pre-computed statistics fields for database storage.
 * Note: Grade ranges are stored as indices only. Frontend converts to French/YDS/etc.
 */
export interface SectorStatisticsFields {
  // Grade Distribution Stats (indices only - frontend converts to display format)
  minGradeIndex: number | null
  maxGradeIndex: number | null
  modeGradeIndex: number | null
  beginnerRoutesCount: number | null
  intermediateRoutesCount: number | null
  advancedRoutesCount: number | null
  eliteRoutesCount: number | null
  difficultySpread: string | null
  concentrationScore: number | null

  // Style Distribution Stats
  sportCount: number | null
  tradCount: number | null
  boulderCount: number | null
  aidCount: number | null
  alpineCount: number | null
  primaryStyle: string | null
  isMultiStyle: boolean

  // Quality Stats
  classicRoutesCount: number | null
  recommendedRoutesCount: number | null
  highQualityRoutesCount: number | null
  averageQualityScore: number | null
  averageStars: number | null
  qualityRating: number | null
  isHighQualitySector: boolean

  // Popularity Stats
  totalAscents: number | null
  popularRoutesCount: number | null
  veryPopularRoutesCount: number | null
  averageAscentsPerRoute: number | null
  popularityScore: number | null
  isPopularSector: boolean

  // Height Stats
  maxHeight: number | null
  totalClimbableMeters: number | null
  multiPitchCount: number | null
  singlePitchCount: number | null
  averagePitches: number | null
  isMultiPitchFocused: boolean
  hasTallRoutes: boolean

  // Equipment Stats
  averageBolts: number | null
  maxBolts: number | null
  routesWithTopoCount: number | null
  isWellDocumented: boolean
  isWellEquipped: boolean

  // Audience Profile
  beginnerPercentage: number | null
  intermediatePercentage: number | null
  advancedPercentage: number | null
  elitePercentage: number | null
  primaryAudience: string | null
  isBeginnerFriendly: boolean
  isFamilyFriendly: boolean

  // Overall Scores
  overallScore: number | null
  sectorRating: number | null
}

/**
 * Maps route data to sector statistics fields for database storage.
 * This mapper is used after routes are scraped to calculate comprehensive
 * statistics that enable efficient filtering.
 */
export class SectorStatsMapper {
  /**
   * Calculate sector statistics from an array of routes
   */
  static calculateFromRoutes(
    routes: RouteDataForStats[],
  ): SectorStatisticsFields {
    // Convert database route data to RouteStatsData format
    const routeStatsData: RouteStatsData[] = routes
      .filter(
        (r): r is RouteDataForStats & { gradeBand: number } =>
          r.gradeBand !== null,
      )
      .map((route) => ({
        gradeBand: route.gradeBand,
        stars: route.stars,
        ascents: route.ascents,
        popularity: route.popularity,
        height: route.height,
        pitches: route.pitches,
        bolts: route.bolts,
        hasTopo: route.hasTopo,
        // Decode styleFlags bitmask to individual booleans
        isSport: (route.styleFlags & ClimbingStyle.SPORT) !== 0,
        isTrad: (route.styleFlags & ClimbingStyle.TRAD) !== 0,
        isBoulder: (route.styleFlags & ClimbingStyle.BOULDER) !== 0,
        isAid: (route.styleFlags & ClimbingStyle.AID) !== 0,
        isAlpine: (route.styleFlags & ClimbingStyle.ALPINE) !== 0,
        isMixed: (route.styleFlags & ClimbingStyle.MIXED) !== 0,
        isIce: (route.styleFlags & ClimbingStyle.ICE) !== 0,
        isTopRope: (route.styleFlags & ClimbingStyle.TOP_ROPE) !== 0,
        name: route.name ?? undefined,
      }))

    // Calculate comprehensive stats
    const stats =
      SectorStatsCalculatorService.calculateFromRoutes(routeStatsData)

    // Map to database fields
    return this.mapToDatabaseFields(stats.toPrimitives())
  }

  /**
   * Calculate statistics from pre-aggregated grade bands (gbRoutes array)
   * This is used when we don't have full route data but have the gbRoutes summary
   */
  static calculateFromGradeBands(
    gbRoutes: number[] | null | undefined,
    seasonality: number[] | null | undefined,
  ): Partial<SectorStatisticsFields> {
    const gradeStats = GradeDistributionStats.createFrom(gbRoutes)
    const seasonalityStats = SeasonalityStats.createFrom(seasonality)

    const minIndex = gradeStats.getMinGradeIndex()
    const maxIndex = gradeStats.getMaxGradeIndex()
    const difficultyPercentages = gradeStats.getDifficultyLevelPercentages()

    // Determine primary audience based on difficulty percentages
    let primaryAudience: string | null = null
    if (difficultyPercentages.beginner >= 40) {
      primaryAudience = 'beginner'
    } else if (difficultyPercentages.intermediate >= 40) {
      primaryAudience = 'intermediate'
    } else if (difficultyPercentages.advanced >= 40) {
      primaryAudience = 'advanced'
    } else if (difficultyPercentages.elite >= 20) {
      primaryAudience = 'elite'
    }

    return {
      minGradeIndex: minIndex,
      maxGradeIndex: maxIndex,
      modeGradeIndex: gradeStats.getMostCommonGradeIndex(),
      beginnerRoutesCount: gradeStats.getBeginnerRoutesCount(),
      intermediateRoutesCount: gradeStats.getIntermediateRoutesCount(),
      advancedRoutesCount: gradeStats.getAdvancedRoutesCount(),
      eliteRoutesCount: gradeStats.getEliteRoutesCount(),
      difficultySpread: gradeStats.getDifficultySpread(),
      concentrationScore: gradeStats.getConcentrationScore(),
      beginnerPercentage: difficultyPercentages.beginner,
      intermediatePercentage: difficultyPercentages.intermediate,
      advancedPercentage: difficultyPercentages.advanced,
      elitePercentage: difficultyPercentages.elite,
      primaryAudience,
      isBeginnerFriendly: difficultyPercentages.beginner >= 25,
      isFamilyFriendly:
        difficultyPercentages.beginner >= 40 &&
        !seasonalityStats.isWinterSector(),
    }
  }

  /**
   * Map comprehensive stats primitives to database fields
   */
  private static mapToDatabaseFields(
    stats: ComprehensiveSectorStatsPrimitives,
  ): SectorStatisticsFields {
    const gradeDistribution = stats.gradeDistribution
    const style = stats.styleDistribution
    const quality = stats.quality
    const popularity = stats.popularity
    const height = stats.height
    const equipment = stats.equipment
    const audience = stats.audience

    return {
      // Grade Distribution (indices only - frontend converts)
      minGradeIndex: gradeDistribution.minGradeIndex,
      maxGradeIndex: gradeDistribution.maxGradeIndex,
      modeGradeIndex: gradeDistribution.modeGradeIndex,
      beginnerRoutesCount: gradeDistribution.beginnerCount,
      intermediateRoutesCount: gradeDistribution.intermediateCount,
      advancedRoutesCount: gradeDistribution.advancedCount,
      eliteRoutesCount: gradeDistribution.eliteCount,
      difficultySpread: gradeDistribution.difficultySpread,
      concentrationScore: gradeDistribution.concentrationScore,

      // Style Distribution
      sportCount: style.sportCount,
      tradCount: style.tradCount,
      boulderCount: style.boulderCount,
      aidCount: style.aidCount,
      alpineCount: style.alpineCount,
      primaryStyle: style.primaryStyle,
      isMultiStyle: style.isMultiStyle,

      // Quality Stats
      classicRoutesCount: quality.classicRoutesCount,
      recommendedRoutesCount: quality.recommendedRoutesCount,
      highQualityRoutesCount: quality.highQualityRoutesCount ?? 0,
      averageQualityScore: quality.averageQualityScore,
      averageStars: quality.averageStars,
      qualityRating: quality.qualityRating,
      isHighQualitySector: quality.isHighQualitySector,

      // Popularity Stats
      totalAscents: popularity.totalAscents,
      popularRoutesCount: popularity.popularRoutesCount,
      veryPopularRoutesCount: popularity.veryPopularRoutesCount,
      averageAscentsPerRoute: popularity.averageAscentsPerRoute,
      popularityScore: popularity.popularityScore,
      isPopularSector: popularity.isPopularSector,

      // Height Stats
      maxHeight: height.maxHeight,
      totalClimbableMeters: height.totalClimbableMeters,
      multiPitchCount: height.multiPitchCount,
      singlePitchCount: height.singlePitchCount,
      averagePitches: height.averagePitches,
      isMultiPitchFocused: height.isMultiPitchFocused,
      hasTallRoutes: height.hasTallRoutes,

      // Equipment Stats
      averageBolts: equipment.averageBolts,
      maxBolts: equipment.maxBolts,
      routesWithTopoCount: equipment.routesWithTopoCount,
      isWellDocumented: equipment.isWellDocumented,
      isWellEquipped: equipment.isWellEquipped,

      // Audience Profile
      beginnerPercentage: audience.beginnerPercentage,
      intermediatePercentage: audience.intermediatePercentage,
      advancedPercentage: audience.advancedPercentage,
      elitePercentage: audience.elitePercentage,
      primaryAudience: audience.primaryAudience,
      isBeginnerFriendly: audience.isBeginnerFriendly,
      isFamilyFriendly: audience.isFamilyFriendly,

      // Overall Scores
      overallScore: stats.overallScore,
      sectorRating: stats.sectorRating,
    }
  }
}
