import { GradeConverter } from '@grades/domain/services/grade-converter'
import type { GradeSystem } from '@grades/domain/types/grade-systems.types'

/**
 * Value Object representing a range of climbing grades
 * Uses internal gradeBand system (0-100)
 */
export class GradeRange {
  private constructor(
    private readonly min: number,
    private readonly max: number,
  ) {}

  /**
   * Create a GradeRange from gradeBand values (10-52)
   */
  static create(min: number, max: number): GradeRange {
    if (min < 10) {
      throw new Error('min gradeBand must be >= 10')
    }

    if (max > 52) {
      throw new Error('max gradeBand must be <= 52')
    }

    if (min > max) {
      throw new Error('min gradeBand cannot be greater than max')
    }

    return new GradeRange(min, max)
  }

  /**
   * Create a GradeRange from grade strings in a specific system
   * @param minGrade - Minimum grade string (e.g., "6a", "5.10a")
   * @param maxGrade - Maximum grade string (e.g., "7a", "5.11a")
   * @param system - Grading system to use for conversion
   */
  static createFromGrades(
    minGrade: string,
    maxGrade: string,
    system: GradeSystem,
  ): GradeRange {
    const minIndex = GradeConverter.toIndex(minGrade, system)
    const maxIndex = GradeConverter.toIndex(maxGrade, system)

    if (minIndex === null) {
      throw new Error(
        `Could not convert grade "${minGrade}" in system "${system}"`,
      )
    }

    if (maxIndex === null) {
      throw new Error(
        `Could not convert grade "${maxGrade}" in system "${system}"`,
      )
    }

    return GradeRange.create(minIndex, maxIndex)
  }

  /**
   * Get minimum gradeBand
   */
  getMin(): number {
    return this.min
  }

  /**
   * Get maximum gradeBand
   */
  getMax(): number {
    return this.max
  }

  /**
   * Check if a specific gradeBand is within this range
   */
  isInRange(gradeBand: number): boolean {
    return gradeBand >= this.min && gradeBand <= this.max
  }

  /**
   * Check if a crag has routes in this grade range
   * @param gbRoutes - Array where index = gradeBand, value = number of routes
   */
  hasRoutesInRange(gbRoutes: number[]): boolean {
    for (let i = this.min; i <= this.max; i++) {
      if (gbRoutes[i] > 0) {
        return true
      }
    }
    return false
  }

  /**
   * Calculate the percentage of routes in this grade range
   * @param gbRoutes - Array where index = gradeBand, value = number of routes
   * @returns Percentage of routes in range (0-100)
   */
  getPercentageInRange(gbRoutes: number[]): number {
    const { totalRoutes, routesInRange } = this.countRoutesInRange(gbRoutes)

    if (totalRoutes === 0) {
      return 0
    }

    return (routesInRange / totalRoutes) * 100
  }

  /**
   * Count the number of routes in this grade range
   * @param gbRoutes - Array where index = gradeBand, value = number of routes
   * @returns Number of routes within the grade range
   */
  getRoutesInRange(gbRoutes: number[]): number {
    const { routesInRange } = this.countRoutesInRange(gbRoutes)
    return routesInRange
  }

  /**
   * Count total routes and routes in range
   * @param gbRoutes - Array where index = gradeBand, value = number of routes
   * @returns Object with totalRoutes and routesInRange counts
   */
  private countRoutesInRange(gbRoutes: number[]): {
    totalRoutes: number
    routesInRange: number
  } {
    let totalRoutes = 0
    let routesInRange = 0

    for (let i = 0; i < gbRoutes.length; i++) {
      totalRoutes += gbRoutes[i]
      if (this.isInRange(i)) {
        routesInRange += gbRoutes[i]
      }
    }

    return { totalRoutes, routesInRange }
  }
}
