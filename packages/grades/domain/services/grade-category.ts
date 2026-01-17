/**
 * Grade category for UI display (colors and filters)
 * Derived from universal grade index
 */
export type GradeCategory = 'easy' | 'medium' | 'hard' | 'extreme'

/**
 * Grade category thresholds based on French grades:
 * - easy: 3 to 5c+ (index 10-23)
 * - medium: 6a to 6c+ (index 24-29)
 * - hard: 7a to 7c+ (index 30-35)
 * - extreme: 8a and above (index 36+)
 */
const GRADE_CATEGORY_THRESHOLDS = {
  MEDIUM_START: 24, // 6a
  HARD_START: 30, // 7a
  EXTREME_START: 36, // 8a
} as const

/**
 * Get the grade category from a universal grade index
 *
 * @param gradeIndex - Universal grade index (10-52+)
 * @returns Grade category for UI display
 */
export function getGradeCategory(gradeIndex: number | null): GradeCategory {
  if (
    gradeIndex === null ||
    gradeIndex < GRADE_CATEGORY_THRESHOLDS.MEDIUM_START
  ) {
    return 'easy'
  }
  if (gradeIndex < GRADE_CATEGORY_THRESHOLDS.HARD_START) {
    return 'medium'
  }
  if (gradeIndex < GRADE_CATEGORY_THRESHOLDS.EXTREME_START) {
    return 'hard'
  }
  return 'extreme'
}

/**
 * Get the grade category thresholds for reference
 * Useful for documentation and testing
 */
export function getGradeCategoryThresholds(): typeof GRADE_CATEGORY_THRESHOLDS {
  return GRADE_CATEGORY_THRESHOLDS
}

/**
 * Colors for each grade category (consistent with frontend design system)
 */
const GRADE_CATEGORY_COLORS: Record<GradeCategory, string> = {
  easy: '#22c55e', // green-500
  medium: '#eab308', // yellow-500
  hard: '#ef4444', // red-500
  extreme: '#a855f7', // purple-500
}

/**
 * Get the color for a grade category
 *
 * @param category - Grade category
 * @returns Hex color code for the category
 */
export function getGradeCategoryColor(category: GradeCategory): string {
  return GRADE_CATEGORY_COLORS[category]
}

/**
 * Get the color for a grade based on its universal index
 *
 * @param gradeIndex - Universal grade index (10-52+)
 * @returns Hex color code for the grade's category
 */
export function getGradeColor(gradeIndex: number | null): string {
  const category = getGradeCategory(gradeIndex)
  return GRADE_CATEGORY_COLORS[category]
}
