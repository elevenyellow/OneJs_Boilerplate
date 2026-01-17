import { describe, expect, test } from 'bun:test'
import { EquipmentStats } from '../equipment-stats.vo'

describe('EquipmentStats Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create from equipment data (simplest)
  // 2. ✓ Get average bolts
  // 3. ✓ Get max bolts
  // 4. ✓ Get routes with topo count and percentage
  // 5. ✓ Get well-equipped routes percentage
  // 6. ✓ Detect well-documented sector
  // 7. ✓ Create empty stats
  // 8. ✓ Serialize to primitives

  describe('Creation', () => {
    test('should create from equipment data', () => {
      // Arrange
      const data = {
        totalRoutes: 100,
        averageBolts: 8,
        maxBolts: 15,
        routesWithTopoCount: 80,
        wellEquippedRoutesCount: 70,
      }

      // Act
      const stats = EquipmentStats.createFrom(data)

      // Assert
      expect(stats).toBeInstanceOf(EquipmentStats)
      expect(stats.getTotalRoutes()).toBe(100)
    })

    test('should create empty stats', () => {
      // Act
      const stats = EquipmentStats.createEmpty()

      // Assert
      expect(stats.getTotalRoutes()).toBe(0)
      expect(stats.isEmpty()).toBe(true)
    })
  })

  describe('Bolt Metrics', () => {
    test('should get average bolts', () => {
      // Arrange
      const data = {
        totalRoutes: 50,
        averageBolts: 10.5,
      }

      // Act
      const stats = EquipmentStats.createFrom(data)

      // Assert
      expect(stats.getAverageBolts()).toBe(10.5)
    })

    test('should get max bolts', () => {
      // Arrange
      const data = {
        totalRoutes: 50,
        maxBolts: 20,
      }

      // Act
      const stats = EquipmentStats.createFrom(data)

      // Assert
      expect(stats.getMaxBolts()).toBe(20)
    })
  })

  describe('Topo Coverage', () => {
    test('should get routes with topo count and percentage', () => {
      // Arrange
      const data = {
        totalRoutes: 100,
        routesWithTopoCount: 75,
      }

      // Act
      const stats = EquipmentStats.createFrom(data)

      // Assert
      expect(stats.getRoutesWithTopoCount()).toBe(75)
      expect(stats.getRoutesWithTopoPercentage()).toBe(75)
    })

    test('should detect well-documented sector', () => {
      // Arrange - More than 70% with topos
      const data = {
        totalRoutes: 100,
        routesWithTopoCount: 85,
      }

      // Act
      const stats = EquipmentStats.createFrom(data)

      // Assert
      expect(stats.isWellDocumented()).toBe(true)
    })

    test('should detect poorly documented sector', () => {
      // Arrange
      const data = {
        totalRoutes: 100,
        routesWithTopoCount: 20,
      }

      // Act
      const stats = EquipmentStats.createFrom(data)

      // Assert
      expect(stats.isWellDocumented()).toBe(false)
    })
  })

  describe('Equipment Quality', () => {
    test('should get well-equipped routes percentage', () => {
      // Arrange
      const data = {
        totalRoutes: 100,
        wellEquippedRoutesCount: 60,
      }

      // Act
      const stats = EquipmentStats.createFrom(data)

      // Assert
      expect(stats.getWellEquippedRoutesCount()).toBe(60)
      expect(stats.getWellEquippedPercentage()).toBe(60)
    })

    test('should detect well-equipped sector', () => {
      // Arrange
      const data = {
        totalRoutes: 100,
        wellEquippedRoutesCount: 80,
        averageBolts: 10,
      }

      // Act
      const stats = EquipmentStats.createFrom(data)

      // Assert
      expect(stats.isWellEquipped()).toBe(true)
    })
  })

  describe('Serialization', () => {
    test('should convert to primitives', () => {
      // Arrange
      const data = {
        totalRoutes: 100,
        averageBolts: 8,
        maxBolts: 15,
        routesWithTopoCount: 80,
        wellEquippedRoutesCount: 70,
      }

      // Act
      const stats = EquipmentStats.createFrom(data)
      const primitives = stats.toPrimitives()

      // Assert
      expect(primitives).toHaveProperty('totalRoutes')
      expect(primitives).toHaveProperty('averageBolts')
      expect(primitives).toHaveProperty('maxBolts')
      expect(primitives).toHaveProperty('routesWithTopoCount')
      expect(primitives).toHaveProperty('routesWithTopoPercentage')
      expect(primitives).toHaveProperty('isWellDocumented')
      expect(primitives).toHaveProperty('isWellEquipped')
    })
  })
})
