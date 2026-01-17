import { AudienceProfile } from './audience-profile.vo'
import type { AudienceProfilePrimitives } from './audience-profile.vo'
import { EquipmentStats } from './equipment-stats.vo'
import type { EquipmentStatsPrimitives } from './equipment-stats.vo'
import { GradeDistributionStats } from './grade-distribution-stats.vo'
import type { GradeDistributionStatsPrimitives } from './grade-distribution-stats.vo'
import { HeightStats } from './height-stats.vo'
import type { HeightStatsPrimitives } from './height-stats.vo'
import { PopularityStats } from './popularity-stats.vo'
import type { PopularityStatsPrimitives } from './popularity-stats.vo'
import { QualityStats } from './quality-stats.vo'
import type { QualityStatsPrimitives } from './quality-stats.vo'
import { SeasonalityStats } from './seasonality-stats.vo'
import type { SeasonalityStatsPrimitives } from './seasonality-stats.vo'
import { StyleDistribution } from './style-distribution.vo'
import type { StyleDistributionPrimitives } from './style-distribution.vo'

/**
 * Comprehensive statistics composition for a sector
 */
export interface ComprehensiveSectorStatsInput {
  gradeDistribution: GradeDistributionStats
  styleDistribution: StyleDistribution
  quality: QualityStats
  popularity: PopularityStats
  height: HeightStats
  equipment: EquipmentStats
  seasonality: SeasonalityStats
  audience: AudienceProfile
}

/**
 * Serialized comprehensive stats
 */
export interface ComprehensiveSectorStatsPrimitives {
  gradeDistribution: GradeDistributionStatsPrimitives
  styleDistribution: StyleDistributionPrimitives
  quality: QualityStatsPrimitives
  popularity: PopularityStatsPrimitives
  height: HeightStatsPrimitives
  equipment: EquipmentStatsPrimitives
  seasonality: SeasonalityStatsPrimitives
  audience: AudienceProfilePrimitives
  overallScore: number
  sectorRating: number
}

/**
 * Value object that composes all statistical value objects for a sector.
 * Provides a unified view of all sector metrics for filtering and display.
 */
export class ComprehensiveSectorStats {
  private readonly gradeDistribution: GradeDistributionStats
  private readonly styleDistribution: StyleDistribution
  private readonly quality: QualityStats
  private readonly popularity: PopularityStats
  private readonly height: HeightStats
  private readonly equipment: EquipmentStats
  private readonly seasonality: SeasonalityStats
  private readonly audience: AudienceProfile

  private constructor(
    gradeDistribution: GradeDistributionStats,
    styleDistribution: StyleDistribution,
    quality: QualityStats,
    popularity: PopularityStats,
    height: HeightStats,
    equipment: EquipmentStats,
    seasonality: SeasonalityStats,
    audience: AudienceProfile,
  ) {
    this.gradeDistribution = gradeDistribution
    this.styleDistribution = styleDistribution
    this.quality = quality
    this.popularity = popularity
    this.height = height
    this.equipment = equipment
    this.seasonality = seasonality
    this.audience = audience
  }

  /**
   * Creates comprehensive stats from all component stats
   */
  static createFrom(
    input: ComprehensiveSectorStatsInput,
  ): ComprehensiveSectorStats {
    return new ComprehensiveSectorStats(
      input.gradeDistribution,
      input.styleDistribution,
      input.quality,
      input.popularity,
      input.height,
      input.equipment,
      input.seasonality,
      input.audience,
    )
  }

  /**
   * Creates empty comprehensive stats
   */
  static createEmpty(): ComprehensiveSectorStats {
    return new ComprehensiveSectorStats(
      GradeDistributionStats.createEmpty(),
      StyleDistribution.createEmpty(),
      QualityStats.createEmpty(),
      PopularityStats.createEmpty(),
      HeightStats.createEmpty(),
      EquipmentStats.createEmpty(),
      SeasonalityStats.createEmpty(),
      AudienceProfile.createEmpty(),
    )
  }

  // ============================================================================
  // ACCESSORS
  // ============================================================================

  getGradeDistribution(): GradeDistributionStats {
    return this.gradeDistribution
  }

  getStyleDistribution(): StyleDistribution {
    return this.styleDistribution
  }

  getQuality(): QualityStats {
    return this.quality
  }

  getPopularity(): PopularityStats {
    return this.popularity
  }

  getHeight(): HeightStats {
    return this.height
  }

  getEquipment(): EquipmentStats {
    return this.equipment
  }

  getSeasonality(): SeasonalityStats {
    return this.seasonality
  }

  getAudience(): AudienceProfile {
    return this.audience
  }

  // ============================================================================
  // OVERALL METRICS
  // ============================================================================

  /**
   * Calculate overall sector score (0-3, like route stars)
   * Weighted combination of all quality metrics
   */
  getOverallScore(): number {
    // Weight factors:
    // - 30% from quality rating (already 0-3)
    // - 25% from popularity score (already 0-3)
    // - 20% from equipment/documentation quality (normalize to 0-1)
    // - 15% from grade variety (normalize to 0-1)
    // - 10% from seasonality availability (normalize to 0-1)

    const qualityScore = this.quality.getQualityRating() / 3 // 0-3 → 0-1
    const popularityScore = this.popularity.getPopularityScore() / 3 // 0-3 → 0-1
    const equipmentScore =
      (this.equipment.getRoutesWithTopoPercentage() +
        this.equipment.getWellEquippedPercentage()) /
      200 // 0-100 each → 0-1
    const gradeVarietyScore =
      (100 - this.gradeDistribution.getConcentrationScore()) / 100 // 0-100 → 0-1
    const seasonalityScore = Math.min(
      this.seasonality.getMonthsAvailable() / 12,
      1,
    ) // 0-12 → 0-1

    const weightedScore =
      qualityScore * 0.3 +
      popularityScore * 0.25 +
      equipmentScore * 0.2 +
      gradeVarietyScore * 0.15 +
      seasonalityScore * 0.1

    // Convert to 0-3 scale and round to 1 decimal
    return Math.round(weightedScore * 3 * 10) / 10
  }

  /**
   * Calculate sector rating (0-3, like route stars)
   */
  getSectorRating(): number {
    // sectorRating is now the same as overallScore (0-3 scale)
    return this.getOverallScore()
  }

  /**
   * Check if sector has minimal data
   */
  isEmpty(): boolean {
    return (
      this.gradeDistribution.isEmpty() &&
      this.styleDistribution.isEmpty() &&
      this.quality.isEmpty()
    )
  }

  // ============================================================================
  // QUICK FILTERS
  // ============================================================================

  /**
   * Check if sector is good for beginners
   */
  isBeginnerFriendly(): boolean {
    return this.audience.isBeginnerFriendly()
  }

  /**
   * Check if sector is popular destination
   */
  isPopularDestination(): boolean {
    return this.popularity.isPopularSector()
  }

  /**
   * Check if sector has high quality routes
   */
  isHighQuality(): boolean {
    return this.quality.isHighQualitySector()
  }

  /**
   * Check if sector is well documented
   */
  isWellDocumented(): boolean {
    return this.equipment.isWellDocumented()
  }

  /**
   * Check if sector is available year-round
   */
  isYearRound(): boolean {
    return this.seasonality.isYearRound()
  }

  /**
   * Get primary climbing style
   */
  getPrimaryStyle(): string {
    return this.styleDistribution.getPrimaryStyle()
  }

  /**
   * Get grade range in French system
   */
  getGradeRange(): string | null {
    return this.gradeDistribution.getGradeRange('french')
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  toPrimitives(): ComprehensiveSectorStatsPrimitives {
    return {
      gradeDistribution: this.gradeDistribution.toPrimitives(),
      styleDistribution: this.styleDistribution.toPrimitives(),
      quality: this.quality.toPrimitives(),
      popularity: this.popularity.toPrimitives(),
      height: this.height.toPrimitives(),
      equipment: this.equipment.toPrimitives(),
      seasonality: this.seasonality.toPrimitives(),
      audience: this.audience.toPrimitives(),
      overallScore: this.getOverallScore(),
      sectorRating: this.getSectorRating(),
    }
  }

  // ============================================================================
  // EQUALITY
  // ============================================================================

  equals(other: ComprehensiveSectorStats): boolean {
    return (
      this.gradeDistribution.equals(other.gradeDistribution) &&
      this.styleDistribution.equals(other.styleDistribution) &&
      this.quality.equals(other.quality) &&
      this.popularity.equals(other.popularity)
    )
  }

  toString(): string {
    return `ComprehensiveSectorStats(rating=${this.getSectorRating()}, score=${this.getOverallScore()})`
  }
}
