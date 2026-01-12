import { describe, expect, test } from 'bun:test'
import { TopoId } from '../topo-id.vo'

describe('TopoId Value Object', () => {
  // TEST CASES LIST (REASON)
  // Order: simple → complex
  //
  // 1. ✓ Create TopoId from valid string
  // 2. ✓ Create TopoId from numeric string
  // 3. ✓ Get value as string
  // 4. ✓ Reject empty string
  // 5. ✓ Reject whitespace-only string
  // 6. ✓ Trim whitespace from valid id
  // 7. ✓ Two TopoIds with same value are equal
  // 8. ✓ Two TopoIds with different values are not equal
  // 9. ✓ toString returns the id value

  test('should create TopoId from valid string', () => {
    // Act
    const topoId = TopoId.create('topo-123')

    // Assert
    expect(topoId).toBeInstanceOf(TopoId)
  })

  test('should create TopoId from numeric string', () => {
    // Act
    const topoId = TopoId.create('456789')

    // Assert
    expect(topoId).toBeInstanceOf(TopoId)
    expect(topoId.toString()).toBe('456789')
  })

  test('should get value as string', () => {
    // Arrange
    const topoId = TopoId.create('topo-123')

    // Act & Assert
    expect(topoId.getValue()).toBe('topo-123')
  })

  test('should reject empty string', () => {
    // Act & Assert
    expect(() => TopoId.create('')).toThrow()
  })

  test('should reject whitespace-only string', () => {
    // Act & Assert
    expect(() => TopoId.create('   ')).toThrow()
  })

  test('should trim whitespace from valid id', () => {
    // Act
    const topoId = TopoId.create('  topo-123  ')

    // Assert
    expect(topoId.getValue()).toBe('topo-123')
  })

  test('should equal another TopoId with same value', () => {
    // Arrange
    const topoId1 = TopoId.create('topo-123')
    const topoId2 = TopoId.create('topo-123')

    // Act & Assert
    expect(topoId1.equals(topoId2)).toBe(true)
  })

  test('should not equal another TopoId with different value', () => {
    // Arrange
    const topoId1 = TopoId.create('topo-123')
    const topoId2 = TopoId.create('topo-456')

    // Act & Assert
    expect(topoId1.equals(topoId2)).toBe(false)
  })

  test('toString should return the id value', () => {
    // Arrange
    const topoId = TopoId.create('topo-123')

    // Act & Assert
    expect(topoId.toString()).toBe('topo-123')
  })

  describe('createFrom (trusted input)', () => {
    test('should create TopoId from trusted input', () => {
      // Act
      const topoId = TopoId.createFrom('topo-456')

      // Assert
      expect(topoId.getValue()).toBe('topo-456')
    })

    test('should still reject empty string from trusted input', () => {
      // Act & Assert
      expect(() => TopoId.createFrom('')).toThrow()
    })
  })
})
