import { describe, expect, test } from 'bun:test'
import { ContentMetrics } from '../content-metrics.vo'

describe('ContentMetrics Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create content metrics with full data
  // 2. ✓ Create empty content metrics
  // 3. ✓ Calculate topos coverage percentage correctly
  // 4. ✓ Calculate photos density correctly
  // 5. ✓ Calculate information completeness score
  // 6. ✓ Detect well-documented sector
  // 7. ✓ Handle null/undefined input
  // 8. ✓ Serialize to primitives

  describe('Creation', () => {
    test('should create content metrics with full data', () => {
      // Arrange
      const data = {
        totalRoutes: 50,
        routesWithTopo: 40,
        routesWithPhotos: 30,
        totalPhotos: 100,
        hasApproachInfo: true,
        hasBetaInfo: true,
        hasDescription: true,
        hasCoordinates: true,
      }

      // Act
      const metrics = ContentMetrics.createFrom(data)

      // Assert
      expect(metrics).toBeInstanceOf(ContentMetrics)
      expect(metrics.getTotalRoutes()).toBe(50)
      expect(metrics.getRoutesWithTopo()).toBe(40)
    })

    test('should create empty content metrics', () => {
      // Act
      const metrics = ContentMetrics.createEmpty()

      // Assert
      expect(metrics.isEmpty()).toBe(true)
      expect(metrics.getTotalRoutes()).toBe(0)
      expect(metrics.getInformationCompleteness()).toBe(0)
    })

    test('should handle null input', () => {
      // Act
      const metrics = ContentMetrics.createFrom(null)

      // Assert
      expect(metrics.isEmpty()).toBe(true)
    })

    test('should handle undefined input', () => {
      // Act
      const metrics = ContentMetrics.createFrom(undefined)

      // Assert
      expect(metrics.isEmpty()).toBe(true)
    })
  })

  describe('Coverage Calculations', () => {
    test('should calculate topos coverage percentage correctly', () => {
      // Arrange
      const data = {
        totalRoutes: 100,
        routesWithTopo: 75,
        routesWithPhotos: 0,
        totalPhotos: 0,
        hasApproachInfo: false,
        hasBetaInfo: false,
        hasDescription: false,
        hasCoordinates: false,
      }

      // Act
      const metrics = ContentMetrics.createFrom(data)

      // Assert
      expect(metrics.getToposCoverage()).toBe(75)
    })

    test('should calculate photos density correctly', () => {
      // Arrange - 100 photos for 50 routes = 2 photos per route
      const data = {
        totalRoutes: 50,
        routesWithTopo: 0,
        routesWithPhotos: 40,
        totalPhotos: 100,
        hasApproachInfo: false,
        hasBetaInfo: false,
        hasDescription: false,
        hasCoordinates: false,
      }

      // Act
      const metrics = ContentMetrics.createFrom(data)

      // Assert
      expect(metrics.getPhotosDensity()).toBe(2)
    })

    test('should return 0 coverage when no routes', () => {
      // Arrange
      const data = {
        totalRoutes: 0,
        routesWithTopo: 0,
        routesWithPhotos: 0,
        totalPhotos: 0,
        hasApproachInfo: false,
        hasBetaInfo: false,
        hasDescription: false,
        hasCoordinates: false,
      }

      // Act
      const metrics = ContentMetrics.createFrom(data)

      // Assert
      expect(metrics.getToposCoverage()).toBe(0)
      expect(metrics.getPhotosDensity()).toBe(0)
    })
  })

  describe('Information Completeness', () => {
    test('should calculate maximum completeness score for complete sector', () => {
      // Arrange - Sector with all info
      const data = {
        totalRoutes: 50,
        routesWithTopo: 50, // 100% topo coverage
        routesWithPhotos: 50,
        totalPhotos: 100, // 2 photos per route
        hasApproachInfo: true,
        hasBetaInfo: true,
        hasDescription: true,
        hasCoordinates: true,
      }

      // Act
      const metrics = ContentMetrics.createFrom(data)

      // Assert
      expect(metrics.getInformationCompleteness()).toBe(100)
    })

    test('should calculate partial completeness score', () => {
      // Arrange - Sector with some info
      const data = {
        totalRoutes: 100,
        routesWithTopo: 50, // 50% topo coverage
        routesWithPhotos: 25,
        totalPhotos: 50,
        hasApproachInfo: true,
        hasBetaInfo: false,
        hasDescription: true,
        hasCoordinates: false,
      }

      // Act
      const metrics = ContentMetrics.createFrom(data)
      const completeness = metrics.getInformationCompleteness()

      // Assert - Should be between 0 and 100
      expect(completeness).toBeGreaterThan(0)
      expect(completeness).toBeLessThan(100)
    })

    test('should calculate minimum completeness for empty sector', () => {
      // Arrange
      const data = {
        totalRoutes: 50,
        routesWithTopo: 0,
        routesWithPhotos: 0,
        totalPhotos: 0,
        hasApproachInfo: false,
        hasBetaInfo: false,
        hasDescription: false,
        hasCoordinates: false,
      }

      // Act
      const metrics = ContentMetrics.createFrom(data)

      // Assert
      expect(metrics.getInformationCompleteness()).toBe(0)
    })
  })

  describe('Documentation Quality', () => {
    test('should detect well-documented sector', () => {
      // Arrange - High topo coverage and has approach info
      const data = {
        totalRoutes: 50,
        routesWithTopo: 40, // 80% coverage
        routesWithPhotos: 30,
        totalPhotos: 60,
        hasApproachInfo: true,
        hasBetaInfo: true,
        hasDescription: true,
        hasCoordinates: true,
      }

      // Act
      const metrics = ContentMetrics.createFrom(data)

      // Assert
      expect(metrics.isWellDocumented()).toBe(true)
    })

    test('should detect poorly-documented sector', () => {
      // Arrange - Low coverage
      const data = {
        totalRoutes: 100,
        routesWithTopo: 10, // 10% coverage
        routesWithPhotos: 5,
        totalPhotos: 5,
        hasApproachInfo: false,
        hasBetaInfo: false,
        hasDescription: false,
        hasCoordinates: false,
      }

      // Act
      const metrics = ContentMetrics.createFrom(data)

      // Assert
      expect(metrics.isWellDocumented()).toBe(false)
    })

    test('should detect sector with photos', () => {
      // Arrange
      const data = {
        totalRoutes: 50,
        routesWithTopo: 0,
        routesWithPhotos: 30,
        totalPhotos: 60,
        hasApproachInfo: false,
        hasBetaInfo: false,
        hasDescription: false,
        hasCoordinates: false,
      }

      // Act
      const metrics = ContentMetrics.createFrom(data)

      // Assert
      expect(metrics.hasPhotos()).toBe(true)
    })

    test('should detect sector with topos', () => {
      // Arrange
      const data = {
        totalRoutes: 50,
        routesWithTopo: 30,
        routesWithPhotos: 0,
        totalPhotos: 0,
        hasApproachInfo: false,
        hasBetaInfo: false,
        hasDescription: false,
        hasCoordinates: false,
      }

      // Act
      const metrics = ContentMetrics.createFrom(data)

      // Assert
      expect(metrics.hasTopos()).toBe(true)
    })
  })

  describe('Serialization', () => {
    test('should serialize to primitives correctly', () => {
      // Arrange - 100% coverage for all metrics
      const data = {
        totalRoutes: 50,
        routesWithTopo: 50, // 100% topo coverage
        routesWithPhotos: 50, // 100% photo coverage
        totalPhotos: 100,
        hasApproachInfo: true,
        hasBetaInfo: true,
        hasDescription: true,
        hasCoordinates: true,
      }

      // Act
      const metrics = ContentMetrics.createFrom(data)
      const primitives = metrics.toPrimitives()

      // Assert
      expect(primitives.totalRoutes).toBe(50)
      expect(primitives.routesWithTopo).toBe(50)
      expect(primitives.routesWithPhotos).toBe(50)
      expect(primitives.totalPhotos).toBe(100)
      expect(primitives.toposCoverage).toBe(100)
      expect(primitives.photosDensity).toBe(2)
      expect(primitives.hasApproachInfo).toBe(true)
      expect(primitives.hasBetaInfo).toBe(true)
      expect(primitives.hasDescription).toBe(true)
      expect(primitives.hasCoordinates).toBe(true)
      expect(primitives.informationCompleteness).toBe(100)
      expect(primitives.isWellDocumented).toBe(true)
    })
  })
})
