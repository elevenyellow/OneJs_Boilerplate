import { GradeConverter } from '@grades/domain/services/grade-converter'
import type { GradeSystem } from '@grades/domain/types/grade-systems.types'

/**
 * Difficulty levels for climbing routes based on universal grade indices
 * These thresholds are based on common climbing progression levels
 */
const DIFFICULTY_THRESHOLDS = {
  BEGINNER_MAX: 22, // Up to ~5c/5.9 - grades accessible to beginners
  INTERMEDIATE_MAX: 34, // Up to ~6c+/5.11d - intermediate level
  ADVANCED_MAX: 44, // Up to ~7c+/5.13d - advanced level
  // Above 44 = Elite (8a+/5.14+)
} as const

/**
 * Grade distribution histogram entry for visualization
 */
export interface GradeHistogramEntry {
  gradeIndex: number
  count: number
  percentage: number
  gradeLabelFrench: string | null
  gradeLabelYds: string | null
}

/**
 * Difficulty level percentages
 */
export interface DifficultyLevelPercentages {
  beginner: number
  intermediate: number
  advanced: number
  elite: number
}

/**
 * Serialized grade distribution stats
 */
export interface GradeDistributionStatsPrimitives {
  totalRoutes: number
  gradeRangeFrench: string | null
  gradeRangeYds: string | null
  minGradeIndex: number | null
  maxGradeIndex: number | null
  modeGradeIndex: number | null
  medianGradeIndex: number | null
  beginnerCount: number
  intermediateCount: number
  advancedCount: number
  eliteCount: number
  beginnerPercentage: number
  intermediatePercentage: number
  advancedPercentage: number
  elitePercentage: number
  difficultySpread: 'concentrated' | 'varied' | 'unknown'
  concentrationScore: number
}

/**
 * Value object representing grade distribution statistics for a sector or area.
 * Provides detailed analysis of route difficulty distribution for filtering and display.
 *
 * Uses universal grade indices (10-52+) from GradeConverter for cross-system compatibility.
 */
export class GradeDistributionStats {
  private readonly routes: number[]

  private constructor(routes: number[]) {
    this.routes = routes
  }

  /**
   * Creates grade distribution stats from a grade bands routes array.
   * @param gbRoutes Array where index = universal grade index, value = route count
   */
  static createFrom(
    gbRoutes: number[] | null | undefined,
  ): GradeDistributionStats {
    if (!gbRoutes || gbRoutes.length === 0) {
      return new GradeDistributionStats([])
    }
    return new GradeDistributionStats([...gbRoutes])
  }

  /**
   * Creates empty grade distribution stats
   */
  static createEmpty(): GradeDistributionStats {
    return new GradeDistributionStats([])
  }

  // ============================================================================
  // BASIC METRICS
  // ============================================================================

  /**
   * Get total number of routes
   */
  getTotalRoutes(): number {
    return this.routes.reduce((sum, count) => sum + count, 0)
  }

  /**
   * Check if stats are empty (no routes)
   */
  isEmpty(): boolean {
    return this.getTotalRoutes() === 0
  }

  /**
   * Get raw routes array
   */
  getRoutes(): number[] {
    return [...this.routes]
  }

  // ============================================================================
  // GRADE RANGE
  // ============================================================================

  /**
   * Get minimum grade index with routes
   */
  getMinGradeIndex(): number | null {
    for (let i = 0; i < this.routes.length; i++) {
      if (this.routes[i] > 0) return i
    }
    return null
  }

  /**
   * Get maximum grade index with routes
   */
  getMaxGradeIndex(): number | null {
    for (let i = this.routes.length - 1; i >= 0; i--) {
      if (this.routes[i] > 0) return i
    }
    return null
  }

  /**
   * Get grade range as human-readable string
   * @param system Grading system to use (french, yds, etc.)
   */
  getGradeRange(system: GradeSystem = 'french'): string | null {
    const minIndex = this.getMinGradeIndex()
    const maxIndex = this.getMaxGradeIndex()

    if (minIndex === null || maxIndex === null) return null

    const minLabel = GradeConverter.fromIndex(minIndex, system)
    const maxLabel = GradeConverter.fromIndex(maxIndex, system)

    if (!minLabel || !maxLabel) return null

    if (minIndex === maxIndex) return minLabel

    return `${minLabel} - ${maxLabel}`
  }

  // ============================================================================
  // STATISTICAL ANALYSIS
  // ============================================================================

  /**
   * Get most common grade index (mode)
   */
  getMostCommonGradeIndex(): number | null {
    if (this.isEmpty()) return null

    let maxCount = 0
    let modeIndex = -1

    for (let i = 0; i < this.routes.length; i++) {
      if (this.routes[i] > maxCount) {
        maxCount = this.routes[i]
        modeIndex = i
      }
    }

    return modeIndex >= 0 ? modeIndex : null
  }

  /**
   * Get median grade index
   */
  getMedianGradeIndex(): number | null {
    const total = this.getTotalRoutes()
    if (total === 0) return null

    const medianPosition = Math.ceil(total / 2)
    let cumulative = 0

    for (let i = 0; i < this.routes.length; i++) {
      cumulative += this.routes[i]
      if (cumulative >= medianPosition) {
        return i
      }
    }

    return null
  }

  /**
   * Get difficulty spread classification
   * @returns 'concentrated' if routes are clustered, 'varied' if spread across many grades
   */
  getDifficultySpread(): 'concentrated' | 'varied' | 'unknown' {
    if (this.isEmpty()) return 'unknown'

    const total = this.getTotalRoutes()
    const gradeSpan =
      (this.getMaxGradeIndex() ?? 0) - (this.getMinGradeIndex() ?? 0) + 1

    // Calculate concentration in top 3 grades
    const concentrationInTop3 = this.getConcentrationInTopN(3) / total

    // Concentrated: more than 70% in top 3 grades OR span is less than 10 grades
    if (concentrationInTop3 > 0.7 || gradeSpan < 10) {
      return 'concentrated'
    }

    return 'varied'
  }

  /**
   * Get sum of routes in top N most common grades
   */
  private getConcentrationInTopN(n: number): number {
    const sortedCounts = [...this.routes].sort((a, b) => b - a)
    return sortedCounts.slice(0, n).reduce((sum, count) => sum + count, 0)
  }

  /**
   * Calculate concentration score (0-100)
   * Higher score = more concentrated distribution
   */
  getConcentrationScore(): number {
    if (this.isEmpty()) return 0

    const total = this.getTotalRoutes()
    const gradesWithRoutes = this.routes.filter((count) => count > 0).length

    // If only one grade has routes, maximum concentration
    if (gradesWithRoutes === 1) return 100

    // Calculate Gini coefficient for distribution
    const sortedCounts = [...this.routes]
      .filter((c) => c > 0)
      .sort((a, b) => a - b)
    const n = sortedCounts.length

    let sumOfDifferences = 0
    for (let i = 0; i < n; i++) {
      sumOfDifferences += (2 * (i + 1) - n - 1) * sortedCounts[i]
    }

    const gini = sumOfDifferences / (n * total)
    // Convert to 0-100 scale (Gini is 0-1)
    return Math.round(((gini + 1) / 2) * 100)
  }

  // ============================================================================
  // DIFFICULTY LEVEL COUNTS
  // ============================================================================

  /**
   * Count beginner routes (up to ~5c/5.9)
   */
  getBeginnerRoutesCount(): number {
    return this.countRoutesInRange(0, DIFFICULTY_THRESHOLDS.BEGINNER_MAX)
  }

  /**
   * Count intermediate routes (~6a-6c+/5.10-5.11)
   */
  getIntermediateRoutesCount(): number {
    return this.countRoutesInRange(
      DIFFICULTY_THRESHOLDS.BEGINNER_MAX + 1,
      DIFFICULTY_THRESHOLDS.INTERMEDIATE_MAX,
    )
  }

  /**
   * Count advanced routes (~7a-7c+/5.12-5.13)
   */
  getAdvancedRoutesCount(): number {
    return this.countRoutesInRange(
      DIFFICULTY_THRESHOLDS.INTERMEDIATE_MAX + 1,
      DIFFICULTY_THRESHOLDS.ADVANCED_MAX,
    )
  }

  /**
   * Count elite routes (~8a+/5.14+)
   */
  getEliteRoutesCount(): number {
    return this.countRoutesInRange(
      DIFFICULTY_THRESHOLDS.ADVANCED_MAX + 1,
      this.routes.length - 1,
    )
  }

  /**
   * Count routes in a grade index range
   */
  private countRoutesInRange(minIndex: number, maxIndex: number): number {
    let count = 0
    const max = Math.min(maxIndex, this.routes.length - 1)
    for (let i = minIndex; i <= max; i++) {
      count += this.routes[i] || 0
    }
    return count
  }

  /**
   * Get difficulty level percentages
   */
  getDifficultyLevelPercentages(): DifficultyLevelPercentages {
    const total = this.getTotalRoutes()
    if (total === 0) {
      return { beginner: 0, intermediate: 0, advanced: 0, elite: 0 }
    }

    return {
      beginner: Math.round((this.getBeginnerRoutesCount() / total) * 100),
      intermediate: Math.round(
        (this.getIntermediateRoutesCount() / total) * 100,
      ),
      advanced: Math.round((this.getAdvancedRoutesCount() / total) * 100),
      elite: Math.round((this.getEliteRoutesCount() / total) * 100),
    }
  }

  // ============================================================================
  // HISTOGRAM AND VISUALIZATION
  // ============================================================================

  /**
   * Get histogram data for charts
   * Only returns entries for grades that have routes
   */
  getHistogramData(): GradeHistogramEntry[] {
    const total = this.getTotalRoutes()
    const entries: GradeHistogramEntry[] = []

    for (let i = 0; i < this.routes.length; i++) {
      if (this.routes[i] > 0) {
        entries.push({
          gradeIndex: i,
          count: this.routes[i],
          percentage:
            total > 0 ? Math.round((this.routes[i] / total) * 100) : 0,
          gradeLabelFrench: GradeConverter.fromIndex(i, 'french'),
          gradeLabelYds: GradeConverter.fromIndex(i, 'yds'),
        })
      }
    }

    return entries
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  /**
   * Convert to primitives for storage or API response
   */
  toPrimitives(): GradeDistributionStatsPrimitives {
    const percentages = this.getDifficultyLevelPercentages()

    return {
      totalRoutes: this.getTotalRoutes(),
      gradeRangeFrench: this.getGradeRange('french'),
      gradeRangeYds: this.getGradeRange('yds'),
      minGradeIndex: this.getMinGradeIndex(),
      maxGradeIndex: this.getMaxGradeIndex(),
      modeGradeIndex: this.getMostCommonGradeIndex(),
      medianGradeIndex: this.getMedianGradeIndex(),
      beginnerCount: this.getBeginnerRoutesCount(),
      intermediateCount: this.getIntermediateRoutesCount(),
      advancedCount: this.getAdvancedRoutesCount(),
      eliteCount: this.getEliteRoutesCount(),
      beginnerPercentage: percentages.beginner,
      intermediatePercentage: percentages.intermediate,
      advancedPercentage: percentages.advanced,
      elitePercentage: percentages.elite,
      difficultySpread: this.getDifficultySpread(),
      concentrationScore: this.getConcentrationScore(),
    }
  }

  // ============================================================================
  // EQUALITY
  // ============================================================================

  equals(other: GradeDistributionStats): boolean {
    if (this.routes.length !== other.routes.length) return false
    return this.routes.every((count, i) => count === other.routes[i])
  }

  toString(): string {
    return `GradeDistribution(total=${this.getTotalRoutes()}, range=${this.getGradeRange('french')})`
  }
}
