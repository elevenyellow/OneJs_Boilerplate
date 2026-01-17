import { GradeConverter } from '@grades/domain/services/grade-converter'
import type { GradeSystem } from '@grades/domain/types/grade-systems.types'

/**
 * Supported grading systems for climbing routes
 * Maps to the GradeSystem type from @grades package
 */
export enum GradingSystem {
  FRENCH = 'FRENCH', // French sport climbing (5a, 6b+, 7c, etc.)
  YDS = 'YDS', // Yosemite Decimal System (5.10a, 5.12d, etc.)
  UIAA = 'UIAA', // UIAA scale (IV, VI+, IX, etc.)
  BRITISH = 'BRITISH', // British adjectival (M, VD, HVS, E1, etc.)
  FONT = 'FONT', // Fontainebleau bouldering (6A, 7C+, etc.)
  HUECO = 'HUECO', // Hueco V-scale bouldering (V0, V5, etc.)
}

/**
 * Maps GradingSystem enum to GradeSystem type used by GradeConverter
 */
function toGradeSystem(system: GradingSystem): GradeSystem {
  const mapping: Record<GradingSystem, GradeSystem> = {
    [GradingSystem.FRENCH]: 'french',
    [GradingSystem.YDS]: 'yds',
    [GradingSystem.UIAA]: 'uiaa',
    [GradingSystem.BRITISH]: 'british',
    [GradingSystem.FONT]: 'font',
    [GradingSystem.HUECO]: 'hueco',
  }
  return mapping[system]
}

export class GradeBands {
  private readonly routes: number[]

  private constructor(routes: number[]) {
    this.routes = routes
  }

  static createFrom(routes: number[] | null | undefined): GradeBands {
    return new GradeBands(routes ?? [])
  }

  static createEmpty(): GradeBands {
    return new GradeBands([])
  }

  getRoutes(): number[] {
    return this.routes
  }

  getTotalRoutes(): number {
    return this.routes.reduce((sum, count) => sum + count, 0)
  }

  isEmpty(): boolean {
    return this.routes.length === 0
  }

  toJSON(): { routes: number[] } | null {
    if (this.isEmpty()) return null
    return {
      routes: this.routes,
    }
  }

  equals(other: GradeBands): boolean {
    return JSON.stringify(this.routes) === JSON.stringify(other.routes)
  }

  toString(): string {
    return `Routes: ${this.getTotalRoutes()}`
  }

  /**
   * Get the minimum grade index that has routes
   * @returns The minimum grade index, or null if no routes
   */
  getMinGradeIndex(): number | null {
    if (this.routes.length === 0) return null

    for (let i = 0; i < this.routes.length; i++) {
      if (this.routes[i] > 0) {
        return i
      }
    }

    return null
  }

  /**
   * Get the maximum grade index that has routes
   * @returns The maximum grade index, or null if no routes
   */
  getMaxGradeIndex(): number | null {
    if (this.routes.length === 0) return null

    let maxIndex = -1
    for (let i = 0; i < this.routes.length; i++) {
      if (this.routes[i] > 0) {
        maxIndex = i
      }
    }

    return maxIndex === -1 ? null : maxIndex
  }

  /**
   * Get the grade range as a human-readable string in the specified grading system
   * Returns the min-max range of grades that have routes
   *
   * IMPORTANT: Uses universal grade indices from GradeConverter (10-52+)
   * The routes array indices correspond to these universal indices.
   *
   * @param system - The grading system to use (defaults to French)
   * @returns Grade range string (e.g., "5a - 7b+", "5.10a - 5.12d", or null if no data)
   */
  getGradeRange(system: GradingSystem = GradingSystem.FRENCH): string | null {
    const minIndex = this.getMinGradeIndex()
    const maxIndex = this.getMaxGradeIndex()

    if (minIndex === null || maxIndex === null) return null

    // Convert indices to grade strings using GradeConverter
    const gradeSystem = toGradeSystem(system)
    const minLabel = GradeConverter.fromIndex(minIndex, gradeSystem)
    const maxLabel = GradeConverter.fromIndex(maxIndex, gradeSystem)

    // If conversion fails, return null
    if (!minLabel || !maxLabel) return null

    // If same grade, return single grade
    if (minIndex === maxIndex) return minLabel

    // Return range
    return `${minLabel} - ${maxLabel}`
  }
}
