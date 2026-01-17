import { describe, expect, test } from 'bun:test'
import { OneJsError } from '@OneJs/core'
import { Coordinates } from '../coordinates.vo'

describe('Coordinates Value Object - Validation', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create coordinates with valid latitude and longitude
  // 2. ✓ Create coordinates with null values (empty)
  // 3. ✓ Throw OneJsError for latitude > 90
  // 4. ✓ Throw OneJsError for latitude < -90
  // 5. ✓ Throw OneJsError for longitude > 180
  // 6. ✓ Throw OneJsError for longitude < -180
  // 7. ✓ Allow valid edge case values (90, -90, 180, -180)

  test('should create coordinates with valid latitude and longitude', () => {
    // Arrange & Act
    const coords = Coordinates.createFrom(41.7, 1.8)

    // Assert
    expect(coords.getLatitude()).toBe(41.7)
    expect(coords.getLongitude()).toBe(1.8)
    expect(coords.hasCoordinates()).toBe(true)
  })

  test('should create empty coordinates with null values', () => {
    // Arrange & Act
    const coords = Coordinates.createFrom(null, null)

    // Assert
    expect(coords.getLatitude()).toBe(null)
    expect(coords.getLongitude()).toBe(null)
    expect(coords.hasCoordinates()).toBe(false)
  })

  test('should throw OneJsError when latitude > 90', () => {
    // Arrange & Act & Assert
    expect(() => Coordinates.createFrom(91, 1.8)).toThrow(OneJsError)
  })

  test('should throw OneJsError when latitude < -90', () => {
    // Arrange & Act & Assert
    expect(() => Coordinates.createFrom(-91, 1.8)).toThrow(OneJsError)
  })

  test('should throw OneJsError when longitude > 180', () => {
    // Arrange & Act & Assert
    expect(() => Coordinates.createFrom(41.7, 181)).toThrow(OneJsError)
  })

  test('should throw OneJsError when longitude < -180', () => {
    // Arrange & Act & Assert
    expect(() => Coordinates.createFrom(41.7, -181)).toThrow(OneJsError)
  })

  test('should allow valid edge case values', () => {
    // Arrange & Act
    const maxCoords = Coordinates.createFrom(90, 180)
    const minCoords = Coordinates.createFrom(-90, -180)

    // Assert
    expect(maxCoords.getLatitude()).toBe(90)
    expect(maxCoords.getLongitude()).toBe(180)
    expect(minCoords.getLatitude()).toBe(-90)
    expect(minCoords.getLongitude()).toBe(-180)
  })

  test('should create coordinates from createEmpty static method', () => {
    // Arrange & Act
    const coords = Coordinates.createEmpty()

    // Assert
    expect(coords.getLatitude()).toBe(null)
    expect(coords.getLongitude()).toBe(null)
    expect(coords.hasCoordinates()).toBe(false)
  })

  test('should convert coordinates to array', () => {
    // Arrange
    const coords = Coordinates.createFrom(41.7, 1.8)

    // Act
    const array = coords.toArray()

    // Assert
    expect(array).toEqual([41.7, 1.8])
  })

  test('should return null when converting empty coordinates to array', () => {
    // Arrange
    const coords = Coordinates.createFrom(null, null)

    // Act
    const array = coords.toArray()

    // Assert
    expect(array).toBe(null)
  })

  test('should compare coordinates for equality', () => {
    // Arrange
    const coords1 = Coordinates.createFrom(41.7, 1.8)
    const coords2 = Coordinates.createFrom(41.7, 1.8)
    const coords3 = Coordinates.createFrom(41.6, 1.9)

    // Act & Assert
    expect(coords1.equals(coords2)).toBe(true)
    expect(coords1.equals(coords3)).toBe(false)
  })

  test('should convert coordinates to string', () => {
    // Arrange
    const coords = Coordinates.createFrom(41.7, 1.8)
    const emptyCoords = Coordinates.createFrom(null, null)

    // Act
    const str = coords.toString()
    const emptyStr = emptyCoords.toString()

    // Assert
    expect(str).toBe('41.7,1.8')
    expect(emptyStr).toBe('')
  })
})
