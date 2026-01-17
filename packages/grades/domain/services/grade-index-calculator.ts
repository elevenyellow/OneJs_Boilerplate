import { GradeConverter } from './grade-converter'
import { GradeSystemDetector } from './grade-system-detector'

/**
 * Grades that should be treated as "no grade" (project, unknown, etc.)
 */
const INVALID_GRADE_VALUES = new Set(['', 'project', '?', 'unknown'])

/**
 * Calculate the universal grade index from a grade string.
 * This function centralizes the logic for converting grade strings to universal indices,
 * handling common edge cases like projects, unknown grades, and empty strings.
 *
 * @param gradeString - The grade string to convert (e.g., "6a", "5.10a", "V4")
 * @returns The universal grade index (10-52+), or null if grade cannot be determined
 *
 * @example
 * calculateGradeIndex("6a") // returns 24
 * calculateGradeIndex("7a+") // returns 31
 * calculateGradeIndex("project") // returns null
 * calculateGradeIndex(null) // returns null
 */
export function calculateGradeIndex(gradeString: string | null): number | null {
  if (!gradeString) {
    return null
  }

  const trimmed = gradeString.trim()

  if (INVALID_GRADE_VALUES.has(trimmed.toLowerCase())) {
    return null
  }

  // Detect the grading system from the grade string
  const detection = GradeSystemDetector.detect(trimmed)

  // Convert to universal index using the detected system
  return GradeConverter.toIndex(detection.normalizedValue, detection.system)
}

/**
 * Calculate the universal grade index, returning 0 instead of null for invalid grades.
 * Useful for database storage where a default value is needed.
 *
 * @param gradeString - The grade string to convert
 * @returns The universal grade index (10-52+), or 0 if grade cannot be determined
 */
export function calculateGradeIndexOrZero(gradeString: string | null): number {
  return calculateGradeIndex(gradeString) ?? 0
}
