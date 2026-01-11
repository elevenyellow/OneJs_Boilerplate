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
    let totalGradeIndex = 0
    let gradeCount = 0
    let totalHeight = 0
    let maxHeight: number | null = null
    let heightCount = 0
    let totalAscents = 0

    for (const route of routes) {
      // Grade distribution
      if (route.grade) {
        const normalizedGrade = this.normalizeGrade(route.grade)
        gradeDistribution[normalizedGrade] = (gradeDistribution[normalizedGrade] || 0) + 1

        const gradeIndex = Grade.calculateIndexFromString(route.grade)
        if (gradeIndex) {
          // Track for average
          totalGradeIndex += gradeIndex
          gradeCount++
          
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
        
        // Track max height
        if (maxHeight === null || route.height > maxHeight) {
          maxHeight = route.height
        }
      }

      // Ascents
      if (route.ascents !== null) {
        totalAscents += route.ascents
      }
    }

    const averageHeight = heightCount > 0 ? Math.round(totalHeight / heightCount * 10) / 10 : null
    
    // Calculate average grade
    let avgGrade: string | null = null
    let avgGradeIndex: number | null = null
    if (gradeCount > 0) {
      avgGradeIndex = Math.round(totalGradeIndex / gradeCount)
      avgGrade = Grade.getGradeFromIndex(avgGradeIndex)
    }

    return new SectorStats(
      routes.length,
      minGrade,
      maxGrade,
      avgGrade,
      minGradeIndex,
      maxGradeIndex,
      avgGradeIndex,
      gradeDistribution,
      averageHeight,
      maxHeight,
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
