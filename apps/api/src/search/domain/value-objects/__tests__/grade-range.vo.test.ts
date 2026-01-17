import { describe, expect, test } from 'bun:test'
import { GradeRange } from '../grade-range.vo'

describe('GradeRange Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create grade range with valid min and max gradeBands
  // 2. ✓ Throw error when min > max
  // 3. ✓ Throw error when min < 0
  // 4. ✓ Throw error when max > 100
  // 5. ✓ Get min and max grade bands
  // 6. ✓ Check if a specific gradeBand is in range
  // 7. ✓ Check if a crag has routes in range (gbRoutes array)
  // 8. ✓ Calculate percentage of routes in range
  // 9. ✓ Create from grade strings with system conversion

  test('should create grade range with valid min and max', () => {
    const gradeRange = GradeRange.create(24, 30) // 6a to 7a in gradeBand

    expect(gradeRange.getMin()).toBe(24)
    expect(gradeRange.getMax()).toBe(30)
  })

  test('should throw error when min > max', () => {
    expect(() => GradeRange.create(30, 24)).toThrow(
      'min gradeBand cannot be greater than max',
    )
  })

  test('should throw error when min < 0', () => {
    expect(() => GradeRange.create(-1, 30)).toThrow(
      'min gradeBand must be >= 10',
    )
  })

  test('should throw error when max > 100', () => {
    expect(() => GradeRange.create(24, 101)).toThrow(
      'max gradeBand must be <= 52',
    )
  })

  test('should check if a gradeBand is in range', () => {
    const gradeRange = GradeRange.create(24, 30) // 6a to 7a

    expect(gradeRange.isInRange(25)).toBe(true) // 6a+ is in range
    expect(gradeRange.isInRange(24)).toBe(true) // 6a is in range (boundary)
    expect(gradeRange.isInRange(30)).toBe(true) // 7a is in range (boundary)
    expect(gradeRange.isInRange(23)).toBe(false) // 5c+ is out of range
    expect(gradeRange.isInRange(31)).toBe(false) // 7a+ is out of range
  })

  test('should check if a crag has routes in range', () => {
    const gradeRange = GradeRange.create(24, 30) // 6a to 7a

    // Crag with routes in range (indices 24-30 have values > 0)
    const gbRoutesWithMatch = new Array(100).fill(0)
    gbRoutesWithMatch[25] = 10 // 10 routes at 6a+
    gbRoutesWithMatch[28] = 5 // 5 routes at 6c

    expect(gradeRange.hasRoutesInRange(gbRoutesWithMatch)).toBe(true)

    // Crag with no routes in range
    const gbRoutesNoMatch = new Array(100).fill(0)
    gbRoutesNoMatch[20] = 10 // Routes at 5b
    gbRoutesNoMatch[35] = 5 // Routes at 7c+

    expect(gradeRange.hasRoutesInRange(gbRoutesNoMatch)).toBe(false)
  })

  test('should calculate percentage of routes in range', () => {
    const gradeRange = GradeRange.create(24, 30) // 6a to 7a

    const gbRoutes = new Array(100).fill(0)
    gbRoutes[25] = 20 // 20 routes at 6a+
    gbRoutes[28] = 30 // 30 routes at 6c
    gbRoutes[20] = 40 // 40 routes at 5b (out of range)
    gbRoutes[35] = 10 // 10 routes at 7c+ (out of range)
    // Total: 100 routes, 50 in range = 50%

    expect(gradeRange.getPercentageInRange(gbRoutes)).toBe(50)
  })

  test('should return 0 percentage when crag has no routes', () => {
    const gradeRange = GradeRange.create(24, 30)
    const gbRoutes = new Array(100).fill(0)

    expect(gradeRange.getPercentageInRange(gbRoutes)).toBe(0)
  })

  test('should create from grade strings with system conversion', () => {
    // Using french system
    const gradeRange = GradeRange.createFromGrades('6a', '7a', 'french')

    expect(gradeRange.getMin()).toBe(24) // 6a = 24 in gradeBand
    expect(gradeRange.getMax()).toBe(30) // 7a = 30 in gradeBand
  })

  test('should throw error when grade string cannot be converted', () => {
    expect(() =>
      GradeRange.createFromGrades('invalid', '7a', 'french'),
    ).toThrow('Could not convert grade')
  })

  test('should create from YDS grades', () => {
    const gradeRange = GradeRange.createFromGrades('5.10a', '5.11a', 'yds')

    // Should convert to gradeBand indices
    expect(gradeRange.getMin()).toBeGreaterThan(0)
    expect(gradeRange.getMax()).toBeGreaterThan(gradeRange.getMin())
  })
})
