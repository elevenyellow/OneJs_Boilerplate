import { describe, expect, test } from 'bun:test'
import { SectorStats } from '../sector-stats.vo'

describe('SectorStats Value Object', () => {
  describe('getStarRating', () => {
    test('should return 0 when kudos is null', () => {
      // Arrange
      const stats = SectorStats.createFrom(10, 5, 2, 0, null, 0)

      // Act
      const result = stats.getStarRating()

      // Assert
      expect(result).toBe(0)
    })

    test('should return 0 when kudos is 0', () => {
      // Arrange
      const stats = SectorStats.createFrom(10, 5, 2, 0, 0, 0)

      // Act
      const result = stats.getStarRating()

      // Assert
      expect(result).toBe(0)
    })

    test('should return 0 when kudos is negative', () => {
      // Arrange
      const stats = SectorStats.createFrom(10, 5, 2, 0, -10, 0)

      // Act
      const result = stats.getStarRating()

      // Assert
      expect(result).toBe(0)
    })

    test('should return 1 star for kudos = 1', () => {
      // Arrange
      const stats = SectorStats.createFrom(10, 5, 2, 0, 1, 0)

      // Act
      const result = stats.getStarRating()

      // Assert
      expect(result).toBe(1)
    })

    test('should return 1 star for kudos = 50', () => {
      // Arrange
      const stats = SectorStats.createFrom(10, 5, 2, 0, 50, 0)

      // Act
      const result = stats.getStarRating()

      // Assert
      expect(result).toBe(1)
    })

    test('should return 1 star for kudos = 99', () => {
      // Arrange
      const stats = SectorStats.createFrom(10, 5, 2, 0, 99, 0)

      // Act
      const result = stats.getStarRating()

      // Assert
      expect(result).toBe(1)
    })

    test('should return 2 stars for kudos = 100', () => {
      // Arrange
      const stats = SectorStats.createFrom(10, 5, 2, 0, 100, 0)

      // Act
      const result = stats.getStarRating()

      // Assert
      expect(result).toBe(2)
    })

    test('should return 2 stars for kudos = 150', () => {
      // Arrange
      const stats = SectorStats.createFrom(10, 5, 2, 0, 150, 0)

      // Act
      const result = stats.getStarRating()

      // Assert
      expect(result).toBe(2)
    })

    test('should return 2 stars for kudos = 199', () => {
      // Arrange
      const stats = SectorStats.createFrom(10, 5, 2, 0, 199, 0)

      // Act
      const result = stats.getStarRating()

      // Assert
      expect(result).toBe(2)
    })

    test('should return 3 stars for kudos = 200', () => {
      // Arrange
      const stats = SectorStats.createFrom(10, 5, 2, 0, 200, 0)

      // Act
      const result = stats.getStarRating()

      // Assert
      expect(result).toBe(3)
    })

    test('should return 3 stars for kudos = 250', () => {
      // Arrange
      const stats = SectorStats.createFrom(10, 5, 2, 0, 250, 0)

      // Act
      const result = stats.getStarRating()

      // Assert
      expect(result).toBe(3)
    })

    test('should return 3 stars for kudos = 300', () => {
      // Arrange
      const stats = SectorStats.createFrom(10, 5, 2, 0, 300, 0)

      // Act
      const result = stats.getStarRating()

      // Assert
      expect(result).toBe(3)
    })

    test('should return 3 stars for very high kudos (500+)', () => {
      // Arrange
      const stats = SectorStats.createFrom(10, 5, 2, 0, 500, 0)

      // Act
      const result = stats.getStarRating()

      // Assert
      expect(result).toBe(3)
    })
  })
})
