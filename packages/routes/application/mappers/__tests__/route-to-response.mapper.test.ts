import { describe, expect, test } from 'bun:test'
import { RouteToResponseMapper } from '../route-to-response.mapper'
import { Route } from '../../../domain/entities/route.entity'
import type { RouteCreateDto } from '../../../domain/dtos'

/**
 * Tests for RouteToResponseMapper
 *
 * This mapper converts Route entities to response DTOs with:
 * - gradeIndex: Universal index from gradeBand field
 * - gradeLabel: Grade converted to user's preferred system
 * - gradeCategory: Derived category (easy/medium/hard/extreme)
 */
describe('RouteToResponseMapper', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Convert route to response DTO with french grade
  // 2. ✓ Convert route to response DTO with YDS grade
  // 3. ✓ Handle route with no grade (index 0)
  // 4. ✓ Derive correct grade category from index
  // 5. ✓ Convert multiple routes to list item DTOs

  const createTestRoute = (overrides: Partial<RouteCreateDto> = {}): Route => {
    const defaultDto: RouteCreateDto = {
      id: crypto.randomUUID(),
      externalId: 'ext-123',
      name: 'Test Route',
      urlAncestorStub: null,
      grade: '6a',
      gradeBand: 24, // Universal index for 6a
      gradeStyle: 'sport',
      gradeInContext: null,
      rawGradeMin: null,
      rawGradeMax: null,
      height: 20,
      heightUnit: 'm',
      pitches: 1,
      stars: 3,
      ascents: 50,
      popularity: null,
      style: 'Sport',
      bolts: 8,
      styleFlags: 1, // Sport = 1
      firstAscent: null,
      equipper: null,
      equipDate: null,
      maintainer: null,
      maintDate: null,
      description: null,
      descriptionHtml: null,
      isClosed: false,
      hasWarning: false,
      warningText: null,
      hasTopo: true,
      topoNumber: '1',
      siblingLabel: 1,
      depth: null,
      sectorId: crypto.randomUUID(),
      cragId: crypto.randomUUID(),
      externalParentId: null,
      tags: null,
      warnings: null,
      akaNames: null,
      ...overrides,
    }
    return Route.create(defaultDto)
  }

  describe('toResponseDto', () => {
    test('should convert route to response DTO with french grade', () => {
      // Arrange
      const route = createTestRoute({ gradeBand: 30 }) // 7a

      // Act
      const dto = RouteToResponseMapper.toResponseDto(route, 'french')

      // Assert
      expect(dto.gradeIndex).toBe(30)
      expect(dto.gradeLabel).toBe('7a')
      expect(dto.gradeCategory).toBe('hard')
    })

    test('should convert route to response DTO with YDS grade', () => {
      // Arrange
      const route = createTestRoute({ gradeBand: 30 }) // 7a = 5.11c

      // Act
      const dto = RouteToResponseMapper.toResponseDto(route, 'yds')

      // Assert
      expect(dto.gradeIndex).toBe(30)
      expect(dto.gradeLabel).toBe('5.11c')
      expect(dto.gradeCategory).toBe('hard')
    })

    test('should handle route with no grade (index 0)', () => {
      // Arrange
      const route = createTestRoute({ gradeBand: 0 })

      // Act
      const dto = RouteToResponseMapper.toResponseDto(route, 'french')

      // Assert
      expect(dto.gradeIndex).toBe(0)
      expect(dto.gradeLabel).toBeNull()
      expect(dto.gradeCategory).toBe('easy')
    })

    test('should derive easy category for index 23', () => {
      // Arrange
      const route = createTestRoute({ gradeBand: 23 }) // 5c+

      // Act
      const dto = RouteToResponseMapper.toResponseDto(route, 'french')

      // Assert
      expect(dto.gradeCategory).toBe('easy')
    })

    test('should derive medium category for index 24', () => {
      // Arrange
      const route = createTestRoute({ gradeBand: 24 }) // 6a

      // Act
      const dto = RouteToResponseMapper.toResponseDto(route, 'french')

      // Assert
      expect(dto.gradeCategory).toBe('medium')
    })

    test('should derive hard category for index 30', () => {
      // Arrange
      const route = createTestRoute({ gradeBand: 30 }) // 7a

      // Act
      const dto = RouteToResponseMapper.toResponseDto(route, 'french')

      // Assert
      expect(dto.gradeCategory).toBe('hard')
    })

    test('should derive extreme category for index 36', () => {
      // Arrange
      const route = createTestRoute({ gradeBand: 36 }) // 8a

      // Act
      const dto = RouteToResponseMapper.toResponseDto(route, 'french')

      // Assert
      expect(dto.gradeCategory).toBe('extreme')
    })

    test('should include all expected fields', () => {
      // Arrange
      const route = createTestRoute()

      // Act
      const dto = RouteToResponseMapper.toResponseDto(route, 'french')

      // Assert
      expect(dto.id).toBeDefined()
      expect(dto.externalId).toBe('ext-123')
      expect(dto.name).toBe('Test Route')
      expect(dto.height).toBe(20)
      expect(dto.stars).toBe(3)
      expect(dto.style).toBe('Sport')
      expect(dto.bolts).toBe(8)
      expect(dto.styleFlags).toBe(1) // Sport = 1
      expect(dto.primaryStyle).toBe('Sport')
      expect(dto.isClosed).toBe(false)
      expect(dto.hasTopo).toBe(true)
      expect(dto.sectorId).toBeDefined()
      expect(dto.cragId).toBeDefined()
    })
  })

  describe('toListItemDto', () => {
    test('should convert route to minimal list item DTO', () => {
      // Arrange
      const route = createTestRoute({ gradeBand: 28 }) // 6c

      // Act
      const dto = RouteToResponseMapper.toListItemDto(route, 'french')

      // Assert
      expect(dto.id).toBeDefined()
      expect(dto.name).toBe('Test Route')
      expect(dto.gradeLabel).toBe('6c')
      expect(dto.gradeCategory).toBe('medium')
      expect(dto.stars).toBe(3)
      expect(dto.style).toBe('Sport')
      expect(dto.height).toBe(20)
      expect(dto.isClosed).toBe(false)
    })
  })

  describe('toListItemDtos', () => {
    test('should convert multiple routes', () => {
      // Arrange
      const routes = [
        createTestRoute({ name: 'Route 1', gradeBand: 24 }),
        createTestRoute({ name: 'Route 2', gradeBand: 30 }),
        createTestRoute({ name: 'Route 3', gradeBand: 36 }),
      ]

      // Act
      const dtos = RouteToResponseMapper.toListItemDtos(routes, 'french')

      // Assert
      expect(dtos).toHaveLength(3)
      expect(dtos[0].gradeLabel).toBe('6a')
      expect(dtos[0].gradeCategory).toBe('medium')
      expect(dtos[1].gradeLabel).toBe('7a')
      expect(dtos[1].gradeCategory).toBe('hard')
      expect(dtos[2].gradeLabel).toBe('8a')
      expect(dtos[2].gradeCategory).toBe('extreme')
    })
  })
})
