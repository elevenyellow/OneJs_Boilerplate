import { describe, expect, test } from 'bun:test'
import { HeightStats } from '../height-stats.vo'

describe('HeightStats Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create from height data (simplest)
  // 2. ✓ Get average height
  // 3. ✓ Get max height
  // 4. ✓ Get total climbable meters
  // 5. ✓ Get multi-pitch count and percentage
  // 6. ✓ Get single-pitch count
  // 7. ✓ Get average pitches per route
  // 8. ✓ Detect multi-pitch focused sector
  // 9. ✓ Create empty stats
  // 10. ✓ Serialize to primitives

  describe('Creation', () => {
    test('should create from height data', () => {
      // Arrange
      const data = {
        totalRoutes: 50,
        averageHeight: 25,
        averageHeightUnit: 'm',
        maxHeight: 80,
        totalClimbableMeters: 1250,
        multiPitchCount: 15,
        singlePitchCount: 35,
        averagePitches: 1.8,
      }

      // Act
      const stats = HeightStats.createFrom(data)

      // Assert
      expect(stats).toBeInstanceOf(HeightStats)
      expect(stats.getTotalRoutes()).toBe(50)
    })

    test('should create empty stats', () => {
      // Act
      const stats = HeightStats.createEmpty()

      // Assert
      expect(stats.getTotalRoutes()).toBe(0)
      expect(stats.isEmpty()).toBe(true)
    })
  })

  describe('Height Metrics', () => {
    test('should get average height', () => {
      // Arrange
      const data = {
        totalRoutes: 50,
        averageHeight: 25.5,
        averageHeightUnit: 'm',
      }

      // Act
      const stats = HeightStats.createFrom(data)

      // Assert
      expect(stats.getAverageHeight()).toBe(25.5)
      expect(stats.getAverageHeightUnit()).toBe('m')
    })

    test('should get max height', () => {
      // Arrange
      const data = {
        totalRoutes: 50,
        maxHeight: 120,
      }

      // Act
      const stats = HeightStats.createFrom(data)

      // Assert
      expect(stats.getMaxHeight()).toBe(120)
    })

    test('should get total climbable meters', () => {
      // Arrange
      const data = {
        totalRoutes: 50,
        totalClimbableMeters: 1500,
      }

      // Act
      const stats = HeightStats.createFrom(data)

      // Assert
      expect(stats.getTotalClimbableMeters()).toBe(1500)
    })
  })

  describe('Pitch Metrics', () => {
    test('should get multi-pitch count and percentage', () => {
      // Arrange
      const data = {
        totalRoutes: 100,
        multiPitchCount: 30,
        singlePitchCount: 70,
      }

      // Act
      const stats = HeightStats.createFrom(data)

      // Assert
      expect(stats.getMultiPitchCount()).toBe(30)
      expect(stats.getMultiPitchPercentage()).toBe(30)
    })

    test('should get single-pitch count', () => {
      // Arrange
      const data = {
        totalRoutes: 100,
        singlePitchCount: 85,
      }

      // Act
      const stats = HeightStats.createFrom(data)

      // Assert
      expect(stats.getSinglePitchCount()).toBe(85)
    })

    test('should get average pitches per route', () => {
      // Arrange
      const data = {
        totalRoutes: 50,
        averagePitches: 2.5,
      }

      // Act
      const stats = HeightStats.createFrom(data)

      // Assert
      expect(stats.getAveragePitches()).toBe(2.5)
    })
  })

  describe('Multi-Pitch Analysis', () => {
    test('should detect multi-pitch focused sector', () => {
      // Arrange - More than 30% multi-pitch
      const data = {
        totalRoutes: 100,
        multiPitchCount: 40,
        singlePitchCount: 60,
      }

      // Act
      const stats = HeightStats.createFrom(data)

      // Assert
      expect(stats.isMultiPitchFocused()).toBe(true)
    })

    test('should detect single-pitch focused sector', () => {
      // Arrange
      const data = {
        totalRoutes: 100,
        multiPitchCount: 5,
        singlePitchCount: 95,
      }

      // Act
      const stats = HeightStats.createFrom(data)

      // Assert
      expect(stats.isMultiPitchFocused()).toBe(false)
    })

    test('should detect tall routes sector', () => {
      // Arrange
      const data = {
        totalRoutes: 50,
        averageHeight: 35,
      }

      // Act
      const stats = HeightStats.createFrom(data)

      // Assert
      expect(stats.hasTallRoutes()).toBe(true)
    })
  })

  describe('Serialization', () => {
    test('should convert to primitives', () => {
      // Arrange
      const data = {
        totalRoutes: 50,
        averageHeight: 25,
        averageHeightUnit: 'm',
        maxHeight: 80,
        totalClimbableMeters: 1250,
        multiPitchCount: 15,
        singlePitchCount: 35,
        averagePitches: 1.8,
      }

      // Act
      const stats = HeightStats.createFrom(data)
      const primitives = stats.toPrimitives()

      // Assert
      expect(primitives).toHaveProperty('totalRoutes')
      expect(primitives).toHaveProperty('averageHeight')
      expect(primitives).toHaveProperty('maxHeight')
      expect(primitives).toHaveProperty('totalClimbableMeters')
      expect(primitives).toHaveProperty('multiPitchCount')
      expect(primitives).toHaveProperty('multiPitchPercentage')
      expect(primitives).toHaveProperty('isMultiPitchFocused')
    })
  })
})
