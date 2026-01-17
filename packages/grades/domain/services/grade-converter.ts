import { getGradeToIndexMap, getIndexToGradeMap } from '../tables'
import type {
  GradeEquivalents,
  GradeSystem,
} from '../types/grade-systems.types'
import { GRADE_SYSTEMS } from '../types/grade-systems.types'

/**
 * Service to convert grades between different grading systems
 */
export class GradeConverter {
  /**
   * Convert a grade from one system to a universal index
   */
  static toIndex(grade: string, system: GradeSystem): number | null {
    const gradeMap = getGradeToIndexMap(system)

    // Normalize the grade for lookup
    const normalized =
      system === 'font'
        ? grade // Font is case-sensitive
        : grade.toLowerCase()

    return gradeMap.get(normalized) ?? null
  }

  /**
   * Convert a universal index to a grade in a specific system
   */
  static fromIndex(index: number, system: GradeSystem): string | null {
    const indexMap = getIndexToGradeMap(system)

    // Try exact match first
    if (indexMap.has(index)) {
      return indexMap.get(index) ?? null
    }

    // Find closest grade (round down to easier grade)
    const indices = Array.from(indexMap.keys()).sort((a, b) => a - b)

    // Find the closest lower index
    let closestIndex: number | null = null
    for (const idx of indices) {
      if (idx <= index) {
        closestIndex = idx
      } else {
        break
      }
    }

    if (closestIndex !== null) {
      return indexMap.get(closestIndex) ?? null
    }

    // If index is lower than all grades, return the easiest grade
    if (indices.length > 0) {
      return indexMap.get(indices[0]) ?? null
    }

    return null
  }

  /**
   * Convert a grade from one system to another
   */
  static convert(
    grade: string,
    fromSystem: GradeSystem,
    toSystem: GradeSystem,
  ): string | null {
    if (fromSystem === toSystem) {
      return grade
    }

    const index = GradeConverter.toIndex(grade, fromSystem)
    if (index === null) {
      return null
    }

    return GradeConverter.fromIndex(index, toSystem)
  }

  /**
   * Get all equivalent grades for a given grade
   */
  static getAllEquivalents(
    grade: string,
    system: GradeSystem,
  ): GradeEquivalents {
    const index = GradeConverter.toIndex(grade, system)

    if (index === null) {
      return {
        french: null,
        yds: null,
        uiaa: null,
        british: null,
        font: null,
        hueco: null,
      }
    }

    return GradeConverter.getEquivalentsFromIndex(index)
  }

  /**
   * Get all equivalent grades from a universal index
   */
  static getEquivalentsFromIndex(index: number): GradeEquivalents {
    const equivalents: GradeEquivalents = {
      french: null,
      yds: null,
      uiaa: null,
      british: null,
      font: null,
      hueco: null,
    }

    for (const system of GRADE_SYSTEMS) {
      equivalents[system] = GradeConverter.fromIndex(index, system)
    }

    return equivalents
  }

  /**
   * Get a display string for a grade in the user's preferred system
   * Falls back to original if conversion not possible
   */
  static getDisplayGrade(
    originalGrade: string,
    originalSystem: GradeSystem,
    preferredSystem: GradeSystem,
  ): string {
    if (originalSystem === preferredSystem) {
      return originalGrade
    }

    const converted = GradeConverter.convert(
      originalGrade,
      originalSystem,
      preferredSystem,
    )
    return converted ?? originalGrade
  }
}
