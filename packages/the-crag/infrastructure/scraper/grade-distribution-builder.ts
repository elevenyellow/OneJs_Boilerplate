import { calculateGradeIndex } from '@grades/domain/services/grade-index-calculator'
import type { ScrapedRoute } from './api.interfaces'

/**
 * Builds grade distribution arrays (gbRoutes and gbAscents) from individual routes
 * using the universal grading system instead of TheCrag's gradeBand system.
 *
 * @see docs/features/grades/README.md for grading system documentation
 */
export class GradeDistributionBuilder {
  /**
   * Build gbRoutes array from individual routes
   * Counts how many routes exist at each universal grade index
   */
  static buildGbRoutes(routes: ScrapedRoute[]): number[] {
    const gbRoutes = new Array(100).fill(0)

    for (const route of routes) {
      const gradeIndex = this.getUniversalGradeIndex(route)

      if (gradeIndex !== null && gradeIndex >= 0 && gradeIndex < 100) {
        gbRoutes[gradeIndex]++
      }
    }

    return gbRoutes
  }

  /**
   * Build gbAscents array from individual routes
   * Counts total ascents at each universal grade index
   */
  static buildGbAscents(routes: ScrapedRoute[]): number[] {
    const gbAscents = new Array(100).fill(0)

    for (const route of routes) {
      const gradeIndex = this.getUniversalGradeIndex(route)
      const ascentCount = route.ascentCount || 0

      if (gradeIndex !== null && gradeIndex >= 0 && gradeIndex < 100) {
        gbAscents[gradeIndex] += ascentCount
      }
    }

    return gbAscents
  }

  /**
   * Get universal grade index from a route
   *
   * @returns Universal grade index, or null if grade cannot be determined
   */
  private static getUniversalGradeIndex(route: ScrapedRoute): number | null {
    return calculateGradeIndex(route.grade)
  }

  /**
   * Aggregate gbRoutes from multiple areas (for parent crags)
   */
  static aggregateGbRoutes(
    areas: Array<{ gbRoutes: number[] | number }>,
  ): number[] {
    const aggregated = new Array(100).fill(0)

    for (const area of areas) {
      const routes = Array.isArray(area.gbRoutes) ? area.gbRoutes : []
      for (let i = 0; i < routes.length && i < 100; i++) {
        aggregated[i] += routes[i] || 0
      }
    }

    return aggregated
  }

  /**
   * Aggregate gbAscents from multiple areas (for parent crags)
   */
  static aggregateGbAscents(
    areas: Array<{ gbAscents: number[] | number }>,
  ): number[] {
    const aggregated = new Array(100).fill(0)

    for (const area of areas) {
      const ascents = Array.isArray(area.gbAscents) ? area.gbAscents : []
      for (let i = 0; i < ascents.length && i < 100; i++) {
        aggregated[i] += ascents[i] || 0
      }
    }

    return aggregated
  }
}
