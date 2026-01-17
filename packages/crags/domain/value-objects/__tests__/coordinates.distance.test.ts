import { describe, expect, test } from 'bun:test'
import { Coordinates } from '../coordinates.vo'

describe('Coordinates Value Object - Distance Calculation', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Calculate distance between two points (Haversine formula)
  // 2. ✓ Distance to same coordinates should be 0
  // 3. ✓ Distance should be symmetric (A to B = B to A)
  // 4. ✓ Known distance test case (Barcelona to Montserrat ~50km)

  test('should calculate distance between two coordinates using Haversine', () => {
    // Arrange
    const coord1 = Coordinates.createFrom(41.7, 1.8)
    const coord2 = Coordinates.createFrom(41.6, 1.9)

    // Act
    const distance = coord1.distanceTo(coord2)

    // Assert
    expect(distance).toBeGreaterThan(0)
    expect(distance).toBeLessThan(20) // Should be ~15km
  })

  test('should return 0 distance for same coordinates', () => {
    // Arrange
    const coord1 = Coordinates.createFrom(41.7, 1.8)
    const coord2 = Coordinates.createFrom(41.7, 1.8)

    // Act
    const distance = coord1.distanceTo(coord2)

    // Assert
    expect(distance).toBe(0)
  })

  test('should calculate symmetric distance (A to B = B to A)', () => {
    // Arrange
    const coord1 = Coordinates.createFrom(41.7, 1.8)
    const coord2 = Coordinates.createFrom(41.6, 1.9)

    // Act
    const distanceAtoB = coord1.distanceTo(coord2)
    const distanceBtoA = coord2.distanceTo(coord1)

    // Assert
    expect(distanceAtoB).toBe(distanceBtoA)
  })

  test('should calculate known distance correctly (Barcelona to Montserrat ~37km)', () => {
    // Arrange - Real coordinates
    const barcelona = Coordinates.createFrom(41.3851, 2.1734) // Barcelona
    const montserrat = Coordinates.createFrom(41.5933, 1.8367) // Montserrat

    // Act
    const distance = barcelona.distanceTo(montserrat)

    // Assert - Should be approximately 36-37km
    expect(distance).toBeGreaterThan(35)
    expect(distance).toBeLessThan(38)
  })

  test('should handle coordinates with null values gracefully', () => {
    // Arrange
    const validCoord = Coordinates.createFrom(41.7, 1.8)
    const invalidCoord = Coordinates.createFrom(null, null)

    // Act
    const distance = validCoord.distanceTo(invalidCoord)

    // Assert - Returns null when coordinates are invalid
    expect(distance).toBe(null)
  })
})
