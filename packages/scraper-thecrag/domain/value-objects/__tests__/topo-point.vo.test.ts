import { describe, expect, test } from 'bun:test'
import { TopoPoint } from '../topo-point.vo'

describe('TopoPoint Value Object', () => {
  // TEST CASES LIST (REASON)
  // Order: simple → complex
  //
  // 1. ✓ Create TopoPoint from simple segment "136.3 334.8" (happy path - SIMPLEST)
  // 2. ✓ Parse segment with "lower" marker "164.1 159.9 lower"
  // 3. ✓ Parse segment with "label" marker "80 31.1 lbvyd Sargantana"
  // 4. ✓ Get x coordinate
  // 5. ✓ Get y coordinate
  // 6. ✓ Get marker when present
  // 7. ✓ Get marker label when present
  // 8. ✓ Compare two TopoPoints for equality
  // 9. ✓ Reject segment with missing y coordinate
  // 10. ✓ Reject segment with non-numeric x coordinate
  // 11. ✓ Reject empty segment

  test('should create TopoPoint from simple segment with x and y coordinates', () => {
    // Arrange
    const segment = '136.3 334.8'

    // Act
    const point = TopoPoint.parseFromSegment(segment)

    // Assert
    expect(point).toBeInstanceOf(TopoPoint)
    expect(point.getX()).toBe(136.3)
    expect(point.getY()).toBe(334.8)
    expect(point.getMarker()).toBeNull()
  })

  test('should parse segment with "lower" marker', () => {
    // Arrange
    const segment = '164.1 159.9 lower'

    // Act
    const point = TopoPoint.parseFromSegment(segment)

    // Assert
    expect(point.getX()).toBe(164.1)
    expect(point.getY()).toBe(159.9)
    expect(point.getMarker()).toBe('lower')
    expect(point.getMarkerLabel()).toBeNull()
  })

  test('should parse segment with "label" marker and label text', () => {
    // Arrange
    const segment = '80 31.1 lbvyd Sargantana'

    // Act
    const point = TopoPoint.parseFromSegment(segment)

    // Assert
    expect(point.getX()).toBe(80)
    expect(point.getY()).toBe(31.1)
    expect(point.getMarker()).toBe('label')
    expect(point.getMarkerLabel()).toBe('Sargantana')
  })

  test('should get x coordinate', () => {
    // Arrange
    const point = TopoPoint.parseFromSegment('100 200')

    // Act
    const x = point.getX()

    // Assert
    expect(x).toBe(100)
  })

  test('should get y coordinate', () => {
    // Arrange
    const point = TopoPoint.parseFromSegment('100 200')

    // Act
    const y = point.getY()

    // Assert
    expect(y).toBe(200)
  })

  test('should return null for marker when not present', () => {
    // Arrange
    const point = TopoPoint.parseFromSegment('100 200')

    // Act
    const marker = point.getMarker()

    // Assert
    expect(marker).toBeNull()
  })

  test('should compare two TopoPoints for equality', () => {
    // Arrange
    const point1 = TopoPoint.parseFromSegment('100 200')
    const point2 = TopoPoint.parseFromSegment('100 200')
    const point3 = TopoPoint.parseFromSegment('100 201')

    // Assert
    expect(point1.equals(point2)).toBe(true)
    expect(point1.equals(point3)).toBe(false)
  })

  test('should throw error for segment with missing y coordinate', () => {
    // Arrange
    const segment = '136.3'

    // Act & Assert
    expect(() => TopoPoint.parseFromSegment(segment)).toThrow(
      'Invalid point segment',
    )
  })

  test('should throw error for segment with non-numeric x coordinate', () => {
    // Arrange
    const segment = 'abc 334.8'

    // Act & Assert
    expect(() => TopoPoint.parseFromSegment(segment)).toThrow(
      'Invalid point segment',
    )
  })

  test('should throw error for empty segment', () => {
    // Arrange
    const segment = ''

    // Act & Assert
    expect(() => TopoPoint.parseFromSegment(segment)).toThrow(
      'Invalid point segment',
    )
  })

  test('should return string representation of point', () => {
    // Arrange
    const point = TopoPoint.parseFromSegment('100 200')

    // Act
    const str = point.toString()

    // Assert
    expect(str).toBe('100 200')
  })

  test('should return string representation with marker', () => {
    // Arrange
    const point = TopoPoint.parseFromSegment('100 200 lower')

    // Act
    const str = point.toString()

    // Assert
    expect(str).toBe('100 200 lower')
  })
})
