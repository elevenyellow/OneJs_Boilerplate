import { Grade } from '@climb-zone/shared'

export interface GradeDistribution {
  [grade: string]: number
}

export interface SectorStatsData {
  routeCount: number
  minGrade: string | null
  maxGrade: string | null
  minGradeIndex: number | null
  maxGradeIndex: number | null
  gradeDistribution: GradeDistribution
  averageHeight: number | null
  totalAscents: number | null
}

/**
 * Value Object for aggregated sector statistics
 * Calculated from the routes within a sector
 */
export class SectorStats {
  constructor(
    public readonly routeCount: number,
    public readonly minGrade: string | null,
    public readonly maxGrade: string | null,
    public readonly minGradeIndex: number | null,
    public readonly maxGradeIndex: number | null,
    public readonly gradeDistribution: GradeDistribution,
    public readonly averageHeight: number | null,
    public readonly totalAscents: number | null,
  ) {}

  /**
   * Check if a grade falls within this sector's range
   */
  hasGradeInRange(grade: string): boolean {
    if (!this.minGradeIndex || !this.maxGradeIndex) return true

    const gradeIndex = Grade.calculateIndexFromString(grade)
    if (!gradeIndex) return false

    return gradeIndex >= this.minGradeIndex && gradeIndex <= this.maxGradeIndex
  }

  /**
   * Get the most common grade in this sector
   */
  getMostCommonGrade(): string | null {
    if (Object.keys(this.gradeDistribution).length === 0) return null

    let maxCount = 0
    let mostCommon: string | null = null

    for (const [grade, count] of Object.entries(this.gradeDistribution)) {
      if (count > maxCount) {
        maxCount = count
        mostCommon = grade
      }
    }

    return mostCommon
  }

  toJSON(): SectorStatsData {
    return {
      routeCount: this.routeCount,
      minGrade: this.minGrade,
      maxGrade: this.maxGrade,
      minGradeIndex: this.minGradeIndex,
      maxGradeIndex: this.maxGradeIndex,
      gradeDistribution: this.gradeDistribution,
      averageHeight: this.averageHeight,
      totalAscents: this.totalAscents,
    }
  }

  static fromJSON(data: SectorStatsData | null | undefined): SectorStats {
    if (!data) return SectorStats.empty()

    return new SectorStats(
      data.routeCount,
      data.minGrade,
      data.maxGrade,
      data.minGradeIndex,
      data.maxGradeIndex,
      data.gradeDistribution,
      data.averageHeight,
      data.totalAscents,
    )
  }

  static empty(): SectorStats {
    return new SectorStats(0, null, null, null, null, {}, null, null)
  }
}
