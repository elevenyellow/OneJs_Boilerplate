import { describe, expect, test } from 'bun:test'
import { SeasonalityStats } from '../seasonality-stats.vo'

describe('SeasonalityStats Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create from month array (simplest)
  // 2. ✓ Get best months
  // 3. ✓ Get best season label
  // 4. ✓ Get months available count
  // 5. ✓ Detect year-round sector
  // 6. ✓ Detect winter sector
  // 7. ✓ Detect summer sector
  // 8. ✓ Create empty stats
  // 9. ✓ Serialize to primitives

  describe('Creation', () => {
    test('should create from month array', () => {
      // Arrange - Months 1-12 where 1=January
      const months = [1, 2, 3, 10, 11, 12] // Winter months

      // Act
      const stats = SeasonalityStats.createFrom(months)

      // Assert
      expect(stats).toBeInstanceOf(SeasonalityStats)
      expect(stats.getMonthsAvailable()).toBe(6)
    })

    test('should create empty stats', () => {
      // Act
      const stats = SeasonalityStats.createEmpty()

      // Assert
      expect(stats.getMonthsAvailable()).toBe(0)
      expect(stats.isEmpty()).toBe(true)
    })

    test('should handle null or undefined input', () => {
      // Act
      const statsNull = SeasonalityStats.createFrom(null)
      const statsUndefined = SeasonalityStats.createFrom(undefined)

      // Assert
      expect(statsNull.isEmpty()).toBe(true)
      expect(statsUndefined.isEmpty()).toBe(true)
    })
  })

  describe('Best Months', () => {
    test('should get best months array', () => {
      // Arrange
      const months = [3, 4, 5, 9, 10]

      // Act
      const stats = SeasonalityStats.createFrom(months)

      // Assert
      expect(stats.getBestMonths()).toEqual([3, 4, 5, 9, 10])
    })

    test('should get months available count', () => {
      // Arrange
      const months = [1, 2, 3, 4]

      // Act
      const stats = SeasonalityStats.createFrom(months)

      // Assert
      expect(stats.getMonthsAvailable()).toBe(4)
    })
  })

  describe('Season Detection', () => {
    test('should detect year-round sector', () => {
      // Arrange - All months available
      const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

      // Act
      const stats = SeasonalityStats.createFrom(months)

      // Assert
      expect(stats.isYearRound()).toBe(true)
    })

    test('should detect winter sector', () => {
      // Arrange - Only winter months
      const months = [11, 12, 1, 2]

      // Act
      const stats = SeasonalityStats.createFrom(months)

      // Assert
      expect(stats.isWinterSector()).toBe(true)
      expect(stats.isSummerSector()).toBe(false)
    })

    test('should detect summer sector', () => {
      // Arrange - Only summer months
      const months = [6, 7, 8]

      // Act
      const stats = SeasonalityStats.createFrom(months)

      // Assert
      expect(stats.isSummerSector()).toBe(true)
      expect(stats.isWinterSector()).toBe(false)
    })

    test('should detect spring/autumn sector', () => {
      // Arrange - Spring and autumn months
      const months = [3, 4, 5, 9, 10, 11]

      // Act
      const stats = SeasonalityStats.createFrom(months)

      // Assert
      expect(stats.isSpringAutumnSector()).toBe(true)
    })
  })

  describe('Season Label', () => {
    test('should get best season label for year-round', () => {
      // Arrange
      const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

      // Act
      const stats = SeasonalityStats.createFrom(months)
      const label = stats.getBestSeasonLabel()

      // Assert
      expect(label).toBe('Todo el año')
    })

    test('should get best season label for winter', () => {
      // Arrange
      const months = [11, 12, 1, 2]

      // Act
      const stats = SeasonalityStats.createFrom(months)
      const label = stats.getBestSeasonLabel()

      // Assert
      expect(label).toContain('Invierno')
    })

    test('should get best season label for summer', () => {
      // Arrange
      const months = [6, 7, 8]

      // Act
      const stats = SeasonalityStats.createFrom(months)
      const label = stats.getBestSeasonLabel()

      // Assert
      expect(label).toContain('Verano')
    })
  })

  describe('Month Checks', () => {
    test('should check if specific month is available', () => {
      // Arrange
      const months = [3, 4, 5]

      // Act
      const stats = SeasonalityStats.createFrom(months)

      // Assert
      expect(stats.isMonthAvailable(3)).toBe(true)
      expect(stats.isMonthAvailable(4)).toBe(true)
      expect(stats.isMonthAvailable(7)).toBe(false)
    })

    test('should get month names for best months', () => {
      // Arrange
      const months = [1, 2, 3]

      // Act
      const stats = SeasonalityStats.createFrom(months)
      const names = stats.getBestMonthNames()

      // Assert
      expect(names).toContain('Enero')
      expect(names).toContain('Febrero')
      expect(names).toContain('Marzo')
    })
  })

  describe('Serialization', () => {
    test('should convert to primitives', () => {
      // Arrange
      const months = [3, 4, 5, 9, 10]

      // Act
      const stats = SeasonalityStats.createFrom(months)
      const primitives = stats.toPrimitives()

      // Assert
      expect(primitives).toHaveProperty('bestMonths')
      expect(primitives).toHaveProperty('monthsAvailable')
      expect(primitives).toHaveProperty('bestSeasonLabel')
      expect(primitives).toHaveProperty('isYearRound')
      expect(primitives).toHaveProperty('isWinterSector')
      expect(primitives).toHaveProperty('isSummerSector')
    })
  })
})
