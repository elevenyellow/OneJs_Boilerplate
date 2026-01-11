/**
 * French grade conversion utilities
 *
 * IMPORTANT: The GRADE_TO_INDEX mapping must match the backend's Grade.calculateIndexFromString
 * to ensure consistent filtering across frontend and backend.
 * See: packages/shared/domain/value-objects/grade.vo.ts
 */

export const FRENCH_GRADES = [
  '3a',
  '3b',
  '3c',
  '4a',
  '4b',
  '4c',
  '5a',
  '5a+',
  '5b',
  '5b+',
  '5c',
  '5c+',
  '6a',
  '6a+',
  '6b',
  '6b+',
  '6c',
  '6c+',
  '7a',
  '7a+',
  '7b',
  '7b+',
  '7c',
  '7c+',
  '8a',
  '8a+',
  '8b',
  '8b+',
  '8c',
  '8c+',
  '9a',
  '9a+',
  '9b',
  '9b+',
  '9c',
  '9c+',
] as const

export type FrenchGrade = (typeof FRENCH_GRADES)[number]

/**
 * Grade to index mapping matching backend grade.vo.ts
 * Each grade has a base value, with + adding 2 and letters adding 3/6
 */
const GRADE_TO_INDEX: Record<string, number> = {
  '3': 10,
  '3a': 10,
  '3b': 13,
  '3c': 16,
  '4': 20,
  '4+': 22,
  '4a': 20,
  '4b': 23,
  '4c': 26,
  '5a': 30,
  '5a+': 32,
  '5b': 35,
  '5b+': 37,
  '5c': 40,
  '5c+': 42,
  '6a': 50,
  '6a+': 52,
  '6b': 55,
  '6b+': 57,
  '6c': 60,
  '6c+': 62,
  '7a': 70,
  '7a+': 72,
  '7b': 75,
  '7b+': 77,
  '7c': 80,
  '7c+': 82,
  '8a': 90,
  '8a+': 92,
  '8b': 95,
  '8b+': 97,
  '8c': 100,
  '8c+': 102,
  '9a': 110,
  '9a+': 112,
  '9b': 115,
  '9b+': 117,
  '9c': 120,
  '9c+': 122,
}

/**
 * Convert grade to index for comparison
 * Uses the same index system as the backend for consistency
 * Returns null if grade is not recognized
 */
export function gradeToIndex(grade: string): number | null {
  const normalized = grade.toLowerCase().trim()

  // Direct lookup
  if (GRADE_TO_INDEX[normalized] !== undefined) {
    return GRADE_TO_INDEX[normalized]
  }

  // Handle slash grades (e.g., "6c/c+", "7a+/b")
  if (normalized.includes('/')) {
    const parts = normalized.split('/')
    const firstGrade = parts[0]
    const firstIndex = GRADE_TO_INDEX[firstGrade]
    if (firstIndex !== undefined) {
      return firstIndex + 1 // Midpoint
    }
  }

  // Try parsing variations
  const baseMatch = normalized.match(/^(\d+)([a-c])?(\+)?/)
  if (baseMatch) {
    const [, num, letter, plus] = baseMatch
    const base = parseInt(num) * 10
    const letterOffset = letter ? (letter.charCodeAt(0) - 97) * 3 : 0
    const plusOffset = plus ? 2 : 0
    return base + letterOffset + plusOffset
  }

  return null
}

/**
 * Convert index back to grade
 */
export function indexToGrade(index: number): FrenchGrade {
  if (index < 0 || index >= FRENCH_GRADES.length) {
    return '5a'
  }
  return FRENCH_GRADES[index]
}

/**
 * Get grade display name
 */
export function getGradeDisplay(grade: string): string {
  const normalized = grade.toLowerCase().trim()
  return FRENCH_GRADES.includes(normalized as FrenchGrade) ? normalized : grade
}

/**
 * Get grades in range
 */
export function getGradesInRange(
  minGrade: string,
  maxGrade: string,
): FrenchGrade[] {
  const minIdx = gradeToIndex(minGrade)
  const maxIdx = gradeToIndex(maxGrade)

  if (minIdx === null || maxIdx === null) {
    return [...FRENCH_GRADES]
  }

  return FRENCH_GRADES.filter((grade) => {
    const idx = gradeToIndex(grade)
    return idx !== null && idx >= minIdx && idx <= maxIdx
  })
}

/**
 * Format grade range for display
 */
export function formatGradeRange(min: string, max: string): string {
  return `${getGradeDisplay(min)} - ${getGradeDisplay(max)}`
}

/**
 * Get default grade range based on skill level
 */
export function getDefaultGradeRange(
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert' = 'intermediate',
): { min: string; max: string } {
  switch (level) {
    case 'beginner':
      return { min: '4a', max: '5c' }
    case 'intermediate':
      return { min: '5c', max: '6c' }
    case 'advanced':
      return { min: '6b', max: '7b' }
    case 'expert':
      return { min: '7a', max: '8c' }
    default:
      return { min: '5c', max: '6c' }
  }
}

/**
 * Count routes in grade range using gradeDistribution
 * This is O(n) where n is number of unique grades, very fast for client-side calculations
 *
 * @param gradeDistribution - Object mapping grade strings to route counts
 * @param minGrade - Minimum grade string (e.g., "5c")
 * @param maxGrade - Maximum grade string (e.g., "7a")
 * @returns Number of routes within the grade range
 */
export function countRoutesInGradeRange(
  gradeDistribution: Record<string, number> | null | undefined,
  minGrade: string,
  maxGrade: string,
): number {
  if (!gradeDistribution || typeof gradeDistribution !== 'object') {
    return 0
  }

  const minIndex = gradeToIndex(minGrade)
  const maxIndex = gradeToIndex(maxGrade)

  if (minIndex === null || maxIndex === null) {
    return 0
  }

  let count = 0
  for (const [gradeStr, routeCount] of Object.entries(gradeDistribution)) {
    const gradeIndex = gradeToIndex(gradeStr)
    if (
      gradeIndex !== null &&
      gradeIndex >= minIndex &&
      gradeIndex <= maxIndex
    ) {
      count += routeCount
    }
  }

  return count
}
