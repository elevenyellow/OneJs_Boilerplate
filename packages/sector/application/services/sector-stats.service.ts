import { Injectable } from '@OneJs/core'
import { Grade } from '@climb-zone/shared'
import { SectorStats, type GradeDistribution } from '@sector/domain/value-objects/sector-stats.vo'

export interface RouteData {
  grade: string | null
  height: number | null
  ascents: number | null
}

/**
 * Service for calculating aggregated sector statistics from routes
 */
@Injectable()
export class SectorStatsService {
  /**
   * Calculate sector statistics from an array of routes
   */
  calculateStats(routes: RouteData[]): SectorStats {
    if (routes.length === 0) {
      return SectorStats.empty()
    }

    const gradeDistribution: GradeDistribution = {}
    let minGrade: string | null = null
    let maxGrade: string | null = null
    let minGradeIndex: number | null = null
    let maxGradeIndex: number | null = null
    let totalHeight = 0
    let heightCount = 0
    let totalAscents = 0

    for (const route of routes) {
      // Grade distribution
      if (route.grade) {
        const normalizedGrade = this.normalizeGrade(route.grade)
        gradeDistribution[normalizedGrade] = (gradeDistribution[normalizedGrade] || 0) + 1

        const gradeIndex = Grade.calculateIndexFromString(route.grade)
        if (gradeIndex) {
          if (minGradeIndex === null || gradeIndex < minGradeIndex) {
            minGradeIndex = gradeIndex
            minGrade = route.grade
          }
          if (maxGradeIndex === null || gradeIndex > maxGradeIndex) {
            maxGradeIndex = gradeIndex
            maxGrade = route.grade
          }
        }
      }

      // Height
      if (route.height !== null && route.height > 0) {
        totalHeight += route.height
        heightCount++
      }

      // Ascents
      if (route.ascents !== null) {
        totalAscents += route.ascents
      }
    }

    const averageHeight = heightCount > 0 ? Math.round(totalHeight / heightCount * 10) / 10 : null

    return new SectorStats(
      routes.length,
      minGrade,
      maxGrade,
      minGradeIndex,
      maxGradeIndex,
      gradeDistribution,
      averageHeight,
      totalAscents > 0 ? totalAscents : null,
    )
  }

  /**
   * Normalize a grade for distribution counting
   * Removes variations like "6a/a+" -> "6a"
   */
  private normalizeGrade(grade: string): string {
    // Take only the first part before /
    const parts = grade.split('/')
    return parts[0].toLowerCase().trim()
  }

  /**
   * Calculate grade index from a grade string
   */
  calculateGradeIndex(grade: string | null): number | null {
    return Grade.calculateIndexFromString(grade)
  }
}
