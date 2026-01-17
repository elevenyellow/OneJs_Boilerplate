import type { GradeSystem } from '@grades/domain/types/grade-systems.types'
import { GradeConverter } from '@grades/domain/services/grade-converter'

/**
 * Value Object representing a range of climbing grades
 * Uses normalized grade indices (0-100) internally
 */
export class GradeRange {
  private constructor(
    private readonly min: number,
    private readonly max: number,
  ) {}

  /**
   * Create grade range from normalized indices
   */
  static create(min: number, max: number): GradeRange {
    if (min < 0) {
      throw new Error('min grade must be >= 0')
    }

    if (max > 100) {
      throw new Error('max grade must be <= 100')
    }

    if (min > max) {
      throw new Error('min grade cannot be greater than max')
    }

    return new GradeRange(min, max)
  }

  /**
   * Create grade range from grade strings
   * Converts grades to normalized indices using the grading system
   */
  static createFromGrades(
    minGrade: string,
    maxGrade: string,
    system: GradeSystem,
  ): GradeRange {
    const minIndex = GradeConverter.toIndex(minGrade, system)
    const maxIndex = GradeConverter.toIndex(maxGrade, system)

    if (minIndex === null || maxIndex === null) {
      throw new Error(
        `Could not convert grade: ${minIndex === null ? minGrade : maxGrade}`,
      )
    }

    return GradeRange.create(minIndex, maxIndex)
  }

  /**
   * Get minimum grade index
   */
  getMin(): number {
    return this.min
  }

  /**
   * Get maximum grade index
   */
  getMax(): number {
    return this.max
  }

  /**
   * Check if a specific grade index is within this range
   */
  isInRange(gradeIndex: number): boolean {
    return gradeIndex >= this.min && gradeIndex <= this.max
  }

  /**
   * Check if a crag has routes in this grade range
   * @param gbRoutes Array of route counts per grade band (index = grade band)
   */
  hasRoutesInRange(gbRoutes: number[]): boolean {
    for (let i = this.min; i <= this.max; i++) {
      if (gbRoutes[i] && gbRoutes[i] > 0) {
        return true
      }
    }
    return false
  }

  /**
   * Calculate percentage of routes in this grade range
   * @param gbRoutes Array of route counts per grade band
   * @returns Percentage (0-100)
   */
  getPercentageInRange(gbRoutes: number[]): number {
    let totalRoutes = 0
    let routesInRange = 0

    for (let i = 0; i < gbRoutes.length; i++) {
      const count = gbRoutes[i] || 0
      totalRoutes += count

      if (this.isInRange(i)) {
        routesInRange += count
      }
    }

    if (totalRoutes === 0) {
      return 0
    }

    return Math.round((routesInRange / totalRoutes) * 100)
  }
}
