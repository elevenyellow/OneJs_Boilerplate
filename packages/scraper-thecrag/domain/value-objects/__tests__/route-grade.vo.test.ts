import { describe, expect, test } from 'bun:test'
import { RouteGrade } from '../route-grade.vo'

describe('RouteGrade Value Object', () => {
  // TEST CASES LIST (REASON)
  // Order: simple → complex
  //
  // 1. ✓ Create RouteGrade with grade and class
  // 2. ✓ Get grade string (e.g., "6b", "7a+")
  // 3. ✓ Get grade class (e.g., "gb2", "gb3")
  // 4. ✓ Get color for grade band 1 (easy - green)
  // 5. ✓ Get color for grade band 3 (intermediate - yellow)
  // 6. ✓ Get color for grade band 6 (very hard - red)
  // 7. ✓ Get grade band number from class
  // 8. ✓ Return default color for unknown grade class
  // 9. ✓ Compare two RouteGrades for equality
  // 10. ✓ Parse grade class from grade string if not provided
  // 11. ✓ Check if grade is in a specific band
  // 12. ✓ Create from API response
  // 13. ✓ Return null from empty API response

  test('should create RouteGrade from API response', () => {
    // Arrange
    const apiResponse = {
      data: {
        grade: '6b+',
        gradeClass: 'gb3',
      },
    }

    // Act
    const grade = RouteGrade.fromApiResponse(apiResponse)

    // Assert
    expect(grade).toBeInstanceOf(RouteGrade)
    expect(grade?.getGrade()).toBe('6b+')
    expect(grade?.getGradeClass()).toBe('gb3')
  })

  test('should return null from API response without grade', () => {
    // Arrange
    const apiResponse = {
      data: {},
    }

    // Act
    const grade = RouteGrade.fromApiResponse(apiResponse)

    // Assert
    expect(grade).toBeNull()
  })

  test('should return null from empty API response', () => {
    // Act
    const grade = RouteGrade.fromApiResponse(null)

    // Assert
    expect(grade).toBeNull()
  })

  test('should create RouteGrade with grade and class', () => {
    // Arrange & Act
    const grade = RouteGrade.create('6b', 'gb3')

    // Assert
    expect(grade).toBeInstanceOf(RouteGrade)
  })

  test('should get grade string', () => {
    // Arrange
    const grade = RouteGrade.create('6b+', 'gb3')

    // Act
    const gradeString = grade.getGrade()

    // Assert
    expect(gradeString).toBe('6b+')
  })

  test('should get grade class', () => {
    // Arrange
    const grade = RouteGrade.create('7a', 'gb4')

    // Act
    const gradeClass = grade.getGradeClass()

    // Assert
    expect(gradeClass).toBe('gb4')
  })

  test('should get green color for grade band 1 (easy)', () => {
    // Arrange
    const grade = RouteGrade.create('4a', 'gb1')

    // Act
    const color = grade.getColor()

    // Assert
    expect(color).toBe('#4CAF50')
  })

  test('should get yellow color for grade band 3 (intermediate)', () => {
    // Arrange
    const grade = RouteGrade.create('6b', 'gb3')

    // Act
    const color = grade.getColor()

    // Assert
    expect(color).toBe('#FFC107')
  })

  test('should get red color for grade band 6 (very hard)', () => {
    // Arrange
    const grade = RouteGrade.create('8a', 'gb6')

    // Act
    const color = grade.getColor()

    // Assert
    expect(color).toBe('#F44336')
  })

  test('should get grade band number from class', () => {
    // Arrange
    const grade = RouteGrade.create('7a+', 'gb4')

    // Act
    const band = grade.getBand()

    // Assert
    expect(band).toBe(4)
  })

  test('should return default color for unknown grade class', () => {
    // Arrange
    const grade = RouteGrade.create('Unknown', 'unknown')

    // Act
    const color = grade.getColor()

    // Assert
    expect(color).toBe('#808080') // Gray for unknown
  })

  test('should compare two RouteGrades for equality', () => {
    // Arrange
    const grade1 = RouteGrade.create('6b', 'gb3')
    const grade2 = RouteGrade.create('6b', 'gb3')
    const grade3 = RouteGrade.create('6b+', 'gb3')

    // Assert
    expect(grade1.equals(grade2)).toBe(true)
    expect(grade1.equals(grade3)).toBe(false)
  })

  test('should check if grade is easy (band 1-2)', () => {
    // Arrange
    const easyGrade = RouteGrade.create('5a', 'gb2')
    const hardGrade = RouteGrade.create('8a', 'gb6')

    // Assert
    expect(easyGrade.isEasy()).toBe(true)
    expect(hardGrade.isEasy()).toBe(false)
  })

  test('should check if grade is intermediate (band 3-4)', () => {
    // Arrange
    const intermediateGrade = RouteGrade.create('6c', 'gb4')
    const easyGrade = RouteGrade.create('4a', 'gb1')

    // Assert
    expect(intermediateGrade.isIntermediate()).toBe(true)
    expect(easyGrade.isIntermediate()).toBe(false)
  })

  test('should check if grade is hard (band 5-6)', () => {
    // Arrange
    const hardGrade = RouteGrade.create('7c', 'gb5')
    const easyGrade = RouteGrade.create('5a', 'gb2')

    // Assert
    expect(hardGrade.isHard()).toBe(true)
    expect(easyGrade.isHard()).toBe(false)
  })

  test('should check if grade is elite (band 7-8)', () => {
    // Arrange
    const eliteGrade = RouteGrade.create('9a', 'gb7')
    const hardGrade = RouteGrade.create('7c', 'gb5')

    // Assert
    expect(eliteGrade.isElite()).toBe(true)
    expect(hardGrade.isElite()).toBe(false)
  })

  test('should return string representation', () => {
    // Arrange
    const grade = RouteGrade.create('6b+', 'gb3')

    // Act
    const str = grade.toString()

    // Assert
    expect(str).toBe('6b+')
  })

  test('should create from trusted source', () => {
    // Arrange & Act
    const grade = RouteGrade.createFrom('7a', 'gb4')

    // Assert
    expect(grade.getGrade()).toBe('7a')
    expect(grade.getGradeClass()).toBe('gb4')
  })
})
