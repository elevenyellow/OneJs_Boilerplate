import { describe, expect, test } from 'bun:test'
import {
  getGradeCategory,
  getGradeCategoryThresholds,
  getGradeCategoryColor,
  getGradeColor,
} from '../grade-category'

/**
 * Tests for grade category helper
 *
 * Grade category thresholds (based on French grades):
 * - easy: 3 to 5c+ (index 10-23)
 * - medium: 6a to 6c+ (index 24-29)
 * - hard: 7a to 7c+ (index 30-35)
 * - extreme: 8a and above (index 36+)
 */
describe('getGradeCategory', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Return 'easy' for null input
  // 2. ✓ Return 'easy' for indices below 24 (3 to 5c+)
  // 3. ✓ Return 'medium' for indices 24-29 (6a to 6c+)
  // 4. ✓ Return 'hard' for indices 30-35 (7a to 7c+)
  // 5. ✓ Return 'extreme' for indices 36+ (8a and above)
  // 6. ✓ Handle boundary cases correctly

  test('should return easy for null input', () => {
    expect(getGradeCategory(null)).toBe('easy')
  })

  test('should return easy for indices below 24', () => {
    // Grade 3 = index 10
    expect(getGradeCategory(10)).toBe('easy')
    // Grade 4a = index 12
    expect(getGradeCategory(12)).toBe('easy')
    // Grade 5a = index 18
    expect(getGradeCategory(18)).toBe('easy')
    // Grade 5c+ = index 23 (boundary)
    expect(getGradeCategory(23)).toBe('easy')
  })

  test('should return medium for indices 24-29', () => {
    // Grade 6a = index 24 (boundary)
    expect(getGradeCategory(24)).toBe('medium')
    // Grade 6a+ = index 25
    expect(getGradeCategory(25)).toBe('medium')
    // Grade 6b = index 26
    expect(getGradeCategory(26)).toBe('medium')
    // Grade 6c+ = index 29 (boundary)
    expect(getGradeCategory(29)).toBe('medium')
  })

  test('should return hard for indices 30-35', () => {
    // Grade 7a = index 30 (boundary)
    expect(getGradeCategory(30)).toBe('hard')
    // Grade 7a+ = index 31
    expect(getGradeCategory(31)).toBe('hard')
    // Grade 7b = index 32
    expect(getGradeCategory(32)).toBe('hard')
    // Grade 7c+ = index 35 (boundary)
    expect(getGradeCategory(35)).toBe('hard')
  })

  test('should return extreme for indices 36 and above', () => {
    // Grade 8a = index 36 (boundary)
    expect(getGradeCategory(36)).toBe('extreme')
    // Grade 8a+ = index 37
    expect(getGradeCategory(37)).toBe('extreme')
    // Grade 9a = index 42
    expect(getGradeCategory(42)).toBe('extreme')
    // Grade 9c = index 46
    expect(getGradeCategory(46)).toBe('extreme')
    // Very high index
    expect(getGradeCategory(50)).toBe('extreme')
  })

  test('should handle boundary cases correctly', () => {
    // Exact boundaries
    expect(getGradeCategory(23)).toBe('easy') // Last easy
    expect(getGradeCategory(24)).toBe('medium') // First medium
    expect(getGradeCategory(29)).toBe('medium') // Last medium
    expect(getGradeCategory(30)).toBe('hard') // First hard
    expect(getGradeCategory(35)).toBe('hard') // Last hard
    expect(getGradeCategory(36)).toBe('extreme') // First extreme
  })

  test('should handle edge cases', () => {
    // Very low index
    expect(getGradeCategory(0)).toBe('easy')
    expect(getGradeCategory(5)).toBe('easy')
    // Negative index (edge case)
    expect(getGradeCategory(-1)).toBe('easy')
  })
})

describe('getGradeCategoryThresholds', () => {
  test('should return correct threshold values', () => {
    const thresholds = getGradeCategoryThresholds()

    expect(thresholds.MEDIUM_START).toBe(24) // 6a
    expect(thresholds.HARD_START).toBe(30) // 7a
    expect(thresholds.EXTREME_START).toBe(36) // 8a
  })
})

describe('getGradeCategoryColor', () => {
  test('should return green for easy category', () => {
    expect(getGradeCategoryColor('easy')).toBe('#22c55e')
  })

  test('should return yellow for medium category', () => {
    expect(getGradeCategoryColor('medium')).toBe('#eab308')
  })

  test('should return red for hard category', () => {
    expect(getGradeCategoryColor('hard')).toBe('#ef4444')
  })

  test('should return purple for extreme category', () => {
    expect(getGradeCategoryColor('extreme')).toBe('#a855f7')
  })
})

describe('getGradeColor', () => {
  test('should return green for easy grades (null or < 24)', () => {
    expect(getGradeColor(null)).toBe('#22c55e')
    expect(getGradeColor(10)).toBe('#22c55e')
    expect(getGradeColor(23)).toBe('#22c55e')
  })

  test('should return yellow for medium grades (24-29)', () => {
    expect(getGradeColor(24)).toBe('#eab308')
    expect(getGradeColor(26)).toBe('#eab308')
    expect(getGradeColor(29)).toBe('#eab308')
  })

  test('should return red for hard grades (30-35)', () => {
    expect(getGradeColor(30)).toBe('#ef4444')
    expect(getGradeColor(32)).toBe('#ef4444')
    expect(getGradeColor(35)).toBe('#ef4444')
  })

  test('should return purple for extreme grades (36+)', () => {
    expect(getGradeColor(36)).toBe('#a855f7')
    expect(getGradeColor(42)).toBe('#a855f7')
    expect(getGradeColor(50)).toBe('#a855f7')
  })
})
