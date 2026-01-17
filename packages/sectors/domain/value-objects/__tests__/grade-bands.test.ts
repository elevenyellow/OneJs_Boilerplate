import { describe, expect, test } from 'bun:test'
import { GradeBands, GradingSystem } from '../grade-bands.vo'

/**
 * IMPORTANT: Tests use UNIVERSAL GRADE INDICES from GradeConverter
 *
 * Reference (from packages/grades/domain/tables/):
 * - French: 3=10, 4a=12, 5a=18, 6a=24, 6a+=25, 6b=26, 6b+=27, 6c=28, 7a=30, 7b=32, 7b+=33, 8a=36, 8a+=37, 9a=42, 9b=44, 9c=46
 * - YDS: 5.10a=24, 5.10b=25, 5.11a=28, 5.12a=32, 5.13a=36, 5.14a=40
 * - Font (boulder): 6A=20, 6B=22, 6C=26, 7A=30, 7B=34
 * - Hueco: V0=14, V4=26, V5=28, V6=30
 * - UIAA: III=10, IV=14, V=18, VI=22, VI+=24, VII=26, VIII=30
 * - British: M=10, VD=14, HS=18, VS=20, HVS=24, E1=26, E3=30, E5=34
 */

describe('GradeBands Value Object', () => {
  describe('getGradeRange', () => {
    test('should return null when routes array is empty', () => {
      // Arrange
      const gradeBands = GradeBands.createFrom([], [])

      // Act
      const result = gradeBands.getGradeRange()

      // Assert
      expect(result).toBeNull()
    })

    test('should return null when no routes in any grade', () => {
      // Arrange
      const routes = new Array(50).fill(0)
      const gradeBands = GradeBands.createFrom([], routes)

      // Act
      const result = gradeBands.getGradeRange()

      // Assert
      expect(result).toBeNull()
    })

    test('should return single grade when only one grade has routes', () => {
      // Arrange
      // Index 18 = 5a in universal system
      const routes = new Array(50).fill(0)
      routes[18] = 10
      const gradeBands = GradeBands.createFrom([], routes)

      // Act
      const result = gradeBands.getGradeRange()

      // Assert
      expect(result).toBe('5a')
    })

    test('should return grade range when multiple grades have routes', () => {
      // Arrange
      // Index 18 = 5a, Index 32 = 7b in universal system
      const routes = new Array(50).fill(0)
      routes[18] = 5 // 5a
      routes[24] = 8 // 6a
      routes[30] = 3 // 7a
      routes[32] = 1 // 7b
      const gradeBands = GradeBands.createFrom([], routes)

      // Act
      const result = gradeBands.getGradeRange()

      // Assert
      expect(result).toBe('5a - 7b')
    })

    test('should handle grades with + suffix correctly', () => {
      // Arrange
      // Index 25 = 6a+, Index 27 = 6b+ in universal system
      const routes = new Array(50).fill(0)
      routes[25] = 5 // 6a+
      routes[27] = 2 // 6b+
      const gradeBands = GradeBands.createFrom([], routes)

      // Act
      const result = gradeBands.getGradeRange()

      // Assert
      expect(result).toBe('6a+ - 6b+')
    })

    test('should handle high grades (8a+, 9a, etc.)', () => {
      // Arrange
      // Index 37 = 8a+, Index 42 = 9a in universal system
      const routes = new Array(50).fill(0)
      routes[37] = 2 // 8a+
      routes[42] = 1 // 9a
      const gradeBands = GradeBands.createFrom([], routes)

      // Act
      const result = gradeBands.getGradeRange()

      // Assert
      expect(result).toBe('8a+ - 9a')
    })

    test('should handle beginner grades (3, 4a)', () => {
      // Arrange
      // Index 10 = 3, Index 12 = 4a in universal system
      const routes = new Array(50).fill(0)
      routes[10] = 5 // 3
      routes[12] = 2 // 4a
      const gradeBands = GradeBands.createFrom([], routes)

      // Act
      const result = gradeBands.getGradeRange()

      // Assert
      expect(result).toBe('3 - 4a')
    })

    test('should ignore zero values in between grades', () => {
      // Arrange
      // Index 18 = 5a, Index 30 = 7a in universal system (with zeros in between)
      const routes = new Array(50).fill(0)
      routes[18] = 5 // 5a
      routes[30] = 3 // 7a
      const gradeBands = GradeBands.createFrom([], routes)

      // Act
      const result = gradeBands.getGradeRange()

      // Assert
      expect(result).toBe('5a - 7a')
    })

    test('should handle full spectrum from easy to hard', () => {
      // Arrange
      // Index 10 = 3, Index 46 = 9c in universal system
      const routes = new Array(50).fill(0)
      routes[10] = 1 // 3
      routes[46] = 1 // 9c
      const gradeBands = GradeBands.createFrom([], routes)

      // Act
      const result = gradeBands.getGradeRange()

      // Assert
      expect(result).toBe('3 - 9c')
    })

    test('should work with createEmpty', () => {
      // Arrange
      const gradeBands = GradeBands.createEmpty()

      // Act
      const result = gradeBands.getGradeRange()

      // Assert
      expect(result).toBeNull()
    })

    test('should work with createFrom with null values', () => {
      // Arrange
      const gradeBands = GradeBands.createFrom(null, null)

      // Act
      const result = gradeBands.getGradeRange()

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('getGradeRange - Multiple Grading Systems', () => {
    test('should return French grades by default', () => {
      // Arrange - Routes at indices 18-27 (5a to 6b+ in universal system)
      const routes = new Array(50).fill(0)
      routes[18] = 1 // 5a
      routes[24] = 3 // 6a
      routes[27] = 2 // 6b+
      const gradeBands = GradeBands.createFrom([], routes)

      // Act
      const result = gradeBands.getGradeRange()

      // Assert
      expect(result).toBe('5a - 6b+')
    })

    test('should return French grades when explicitly requested', () => {
      // Arrange - Routes at indices 24-26 (6a to 6b in universal system)
      const routes = new Array(50).fill(0)
      routes[24] = 1 // 6a
      routes[26] = 3 // 6b
      const gradeBands = GradeBands.createFrom([], routes)

      // Act
      const result = gradeBands.getGradeRange(GradingSystem.FRENCH)

      // Assert
      expect(result).toBe('6a - 6b')
    })

    test('should return YDS grades', () => {
      // Arrange - Routes at indices 24-32 (5.10a to 5.12a in universal system)
      const routes = new Array(50).fill(0)
      routes[24] = 1 // 5.10a
      routes[28] = 2 // 5.11a
      routes[32] = 3 // 5.12a
      const gradeBands = GradeBands.createFrom([], routes)

      // Act
      const result = gradeBands.getGradeRange(GradingSystem.YDS)

      // Assert
      expect(result).toBe('5.10a - 5.12a')
    })

    test('should return UIAA grades', () => {
      // Arrange - Routes at indices 18-26 (V to VII in universal system)
      const routes = new Array(50).fill(0)
      routes[18] = 1 // V
      routes[22] = 2 // VI
      routes[26] = 3 // VII
      const gradeBands = GradeBands.createFrom([], routes)

      // Act
      const result = gradeBands.getGradeRange(GradingSystem.UIAA)

      // Assert
      expect(result).toBe('V - VII')
    })

    test('should return British grades', () => {
      // Arrange - Routes at indices 14-24 (VD to HVS in universal system)
      const routes = new Array(50).fill(0)
      routes[14] = 1 // VD
      routes[20] = 2 // VS
      routes[24] = 3 // HVS
      const gradeBands = GradeBands.createFrom([], routes)

      // Act
      const result = gradeBands.getGradeRange(GradingSystem.BRITISH)

      // Assert
      expect(result).toBe('VD - HVS')
    })

    test('should return Font grades', () => {
      // Arrange - Routes at indices 20-30 (6A to 7A in Font/universal system)
      const routes = new Array(50).fill(0)
      routes[20] = 1 // 6A
      routes[26] = 2 // 6C
      routes[30] = 3 // 7A
      const gradeBands = GradeBands.createFrom([], routes)

      // Act
      const result = gradeBands.getGradeRange(GradingSystem.FONT)

      // Assert
      expect(result).toBe('6A - 7A')
    })

    test('should return Hueco grades', () => {
      // Arrange - Routes at indices 14-30 (V0 to V6 in Hueco/universal system)
      const routes = new Array(50).fill(0)
      routes[14] = 1 // V0
      routes[26] = 2 // V4
      routes[30] = 3 // V6
      const gradeBands = GradeBands.createFrom([], routes)

      // Act
      const result = gradeBands.getGradeRange(GradingSystem.HUECO)

      // Assert
      expect(result).toBe('V0 - V6')
    })

    test('should return single grade in YDS when min equals max', () => {
      // Arrange - Only grade at index 24 (5.10a in universal system)
      const routes = new Array(50).fill(0)
      routes[24] = 5 // 5.10a
      const gradeBands = GradeBands.createFrom([], routes)

      // Act
      const result = gradeBands.getGradeRange(GradingSystem.YDS)

      // Assert
      expect(result).toBe('5.10a')
    })

    test('should return single grade in UIAA when min equals max', () => {
      // Arrange - Only grade at index 22 (VI in universal system)
      const routes = new Array(50).fill(0)
      routes[22] = 3 // VI
      const gradeBands = GradeBands.createFrom([], routes)

      // Act
      const result = gradeBands.getGradeRange(GradingSystem.UIAA)

      // Assert
      expect(result).toBe('VI')
    })

    test('should return null for all systems when no routes', () => {
      // Arrange
      const gradeBands = GradeBands.createFrom([], [])

      // Act & Assert
      expect(gradeBands.getGradeRange(GradingSystem.FRENCH)).toBeNull()
      expect(gradeBands.getGradeRange(GradingSystem.YDS)).toBeNull()
      expect(gradeBands.getGradeRange(GradingSystem.UIAA)).toBeNull()
      expect(gradeBands.getGradeRange(GradingSystem.BRITISH)).toBeNull()
      expect(gradeBands.getGradeRange(GradingSystem.FONT)).toBeNull()
      expect(gradeBands.getGradeRange(GradingSystem.HUECO)).toBeNull()
    })
  })

  describe('consistency with GradeDistributionBuilder', () => {
    /**
     * These tests verify that the indices used in GradeBands match those
     * generated by GradeDistributionBuilder, ensuring the system is unified.
     */

    test('should correctly display French grades at GradeDistributionBuilder indices', () => {
      // GradeDistributionBuilder uses: 6a=24, 7a=30, 7b+=33
      const routes = new Array(50).fill(0)
      routes[24] = 2 // 6a (matches GradeDistributionBuilder)
      routes[30] = 1 // 7a
      routes[33] = 3 // 7b+
      const gradeBands = GradeBands.createFrom([], routes)

      const result = gradeBands.getGradeRange(GradingSystem.FRENCH)
      expect(result).toBe('6a - 7b+')
    })

    test('should correctly display YDS grades at GradeDistributionBuilder indices', () => {
      // GradeDistributionBuilder uses: 5.10a=24, 5.11a=28, 5.12a=32
      const routes = new Array(50).fill(0)
      routes[24] = 1 // 5.10a
      routes[28] = 2 // 5.11a
      routes[32] = 1 // 5.12a
      const gradeBands = GradeBands.createFrom([], routes)

      const result = gradeBands.getGradeRange(GradingSystem.YDS)
      expect(result).toBe('5.10a - 5.12a')
    })

    test('should correctly display Font grades at GradeDistributionBuilder indices', () => {
      // GradeDistributionBuilder uses: 6A=20, 6C+=28, 7A=30
      const routes = new Array(50).fill(0)
      routes[20] = 1 // 6A
      routes[28] = 1 // 6C+
      routes[30] = 1 // 7A
      const gradeBands = GradeBands.createFrom([], routes)

      const result = gradeBands.getGradeRange(GradingSystem.FONT)
      expect(result).toBe('6A - 7A')
    })

    test('should correctly display Hueco grades at GradeDistributionBuilder indices', () => {
      // GradeDistributionBuilder uses: V0=14, V4=26, V5=28, V6=30
      const routes = new Array(50).fill(0)
      routes[14] = 1 // V0
      routes[26] = 1 // V4
      routes[30] = 1 // V6
      const gradeBands = GradeBands.createFrom([], routes)

      const result = gradeBands.getGradeRange(GradingSystem.HUECO)
      expect(result).toBe('V0 - V6')
    })
  })
})
