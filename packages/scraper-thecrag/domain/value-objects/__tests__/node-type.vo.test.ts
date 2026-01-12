import { describe, expect, test } from 'bun:test'
import { NodeType } from '../node-type.vo'

describe('NodeType Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create NodeType with valid value 'Region'
  // 2. ✓ Create NodeType with valid value 'Area'
  // 3. ✓ Create NodeType with valid value 'Crag'
  // 4. ✓ Create NodeType with valid value 'Sector'
  // 5. ✓ Create NodeType with valid value 'Cliff'
  // 6. ✓ Reject invalid node type value
  // 7. ✓ createFrom with valid value (trusted source)
  // 8. ✓ isRegion() returns true only for Region
  // 9. ✓ isArea() returns true only for Area
  // 10. ✓ isCrag() returns true only for Crag
  // 11. ✓ isSector() returns true only for Sector
  // 12. ✓ isCliff() returns true only for Cliff
  // 13. ✓ isExpandable() returns true for Region, Area, Crag, Sector
  // 14. ✓ isExpandable() returns false for Cliff
  // 15. ✓ equals() compares two NodeTypes correctly
  // 16. ✓ toString() returns the string value
  // 17. ✓ getValue() returns the raw value
  // 18. ✓ Static factory methods for each type (region(), area(), crag(), sector(), cliff())

  describe('Creation with create()', () => {
    test('should create NodeType with valid value Region', () => {
      const nodeType = NodeType.create('Region')

      expect(nodeType).toBeInstanceOf(NodeType)
      expect(nodeType.getValue()).toBe('Region')
    })

    test('should create NodeType with valid value Area', () => {
      const nodeType = NodeType.create('Area')

      expect(nodeType).toBeInstanceOf(NodeType)
      expect(nodeType.getValue()).toBe('Area')
    })

    test('should create NodeType with valid value Crag', () => {
      const nodeType = NodeType.create('Crag')

      expect(nodeType).toBeInstanceOf(NodeType)
      expect(nodeType.getValue()).toBe('Crag')
    })

    test('should create NodeType with valid value Sector', () => {
      const nodeType = NodeType.create('Sector')

      expect(nodeType).toBeInstanceOf(NodeType)
      expect(nodeType.getValue()).toBe('Sector')
    })

    test('should create NodeType with valid value Cliff', () => {
      const nodeType = NodeType.create('Cliff')

      expect(nodeType).toBeInstanceOf(NodeType)
      expect(nodeType.getValue()).toBe('Cliff')
    })

    test('should throw error for invalid node type value', () => {
      expect(() => NodeType.create('InvalidType')).toThrow('Invalid node type')
    })

    test('should throw error for empty string', () => {
      expect(() => NodeType.create('')).toThrow('Invalid node type')
    })
  })

  describe('Creation with createFrom() (trusted source)', () => {
    test('should create NodeType from trusted source with valid value', () => {
      const nodeType = NodeType.createFrom('Crag')

      expect(nodeType).toBeInstanceOf(NodeType)
      expect(nodeType.getValue()).toBe('Crag')
    })

    test('should throw server error for invalid value from trusted source', () => {
      expect(() => NodeType.createFrom('InvalidType')).toThrow()
    })
  })

  describe('Static factory methods', () => {
    test('should create Region type with region() factory', () => {
      const nodeType = NodeType.region()

      expect(nodeType.isRegion()).toBe(true)
      expect(nodeType.getValue()).toBe('Region')
    })

    test('should create Area type with area() factory', () => {
      const nodeType = NodeType.area()

      expect(nodeType.isArea()).toBe(true)
      expect(nodeType.getValue()).toBe('Area')
    })

    test('should create Crag type with crag() factory', () => {
      const nodeType = NodeType.crag()

      expect(nodeType.isCrag()).toBe(true)
      expect(nodeType.getValue()).toBe('Crag')
    })

    test('should create Sector type with sector() factory', () => {
      const nodeType = NodeType.sector()

      expect(nodeType.isSector()).toBe(true)
      expect(nodeType.getValue()).toBe('Sector')
    })

    test('should create Cliff type with cliff() factory', () => {
      const nodeType = NodeType.cliff()

      expect(nodeType.isCliff()).toBe(true)
      expect(nodeType.getValue()).toBe('Cliff')
    })
  })

  describe('Type check methods', () => {
    test('isRegion() returns true only for Region type', () => {
      expect(NodeType.region().isRegion()).toBe(true)
      expect(NodeType.area().isRegion()).toBe(false)
      expect(NodeType.crag().isRegion()).toBe(false)
      expect(NodeType.sector().isRegion()).toBe(false)
      expect(NodeType.cliff().isRegion()).toBe(false)
    })

    test('isArea() returns true only for Area type', () => {
      expect(NodeType.region().isArea()).toBe(false)
      expect(NodeType.area().isArea()).toBe(true)
      expect(NodeType.crag().isArea()).toBe(false)
      expect(NodeType.sector().isArea()).toBe(false)
      expect(NodeType.cliff().isArea()).toBe(false)
    })

    test('isCrag() returns true only for Crag type', () => {
      expect(NodeType.region().isCrag()).toBe(false)
      expect(NodeType.area().isCrag()).toBe(false)
      expect(NodeType.crag().isCrag()).toBe(true)
      expect(NodeType.sector().isCrag()).toBe(false)
      expect(NodeType.cliff().isCrag()).toBe(false)
    })

    test('isSector() returns true only for Sector type', () => {
      expect(NodeType.region().isSector()).toBe(false)
      expect(NodeType.area().isSector()).toBe(false)
      expect(NodeType.crag().isSector()).toBe(false)
      expect(NodeType.sector().isSector()).toBe(true)
      expect(NodeType.cliff().isSector()).toBe(false)
    })

    test('isCliff() returns true only for Cliff type', () => {
      expect(NodeType.region().isCliff()).toBe(false)
      expect(NodeType.area().isCliff()).toBe(false)
      expect(NodeType.crag().isCliff()).toBe(false)
      expect(NodeType.sector().isCliff()).toBe(false)
      expect(NodeType.cliff().isCliff()).toBe(true)
    })
  })

  describe('isExpandable()', () => {
    test('should return true for Region (can have children)', () => {
      expect(NodeType.region().isExpandable()).toBe(true)
    })

    test('should return true for Area (can have children)', () => {
      expect(NodeType.area().isExpandable()).toBe(true)
    })

    test('should return true for Crag (can have children)', () => {
      expect(NodeType.crag().isExpandable()).toBe(true)
    })

    test('should return true for Sector (can have children)', () => {
      expect(NodeType.sector().isExpandable()).toBe(true)
    })

    test('should return false for Cliff (leaf node, has routes only)', () => {
      expect(NodeType.cliff().isExpandable()).toBe(false)
    })
  })

  describe('Equality', () => {
    test('should return true when comparing equal NodeTypes', () => {
      const type1 = NodeType.create('Crag')
      const type2 = NodeType.create('Crag')

      expect(type1.equals(type2)).toBe(true)
    })

    test('should return false when comparing different NodeTypes', () => {
      const type1 = NodeType.create('Crag')
      const type2 = NodeType.create('Sector')

      expect(type1.equals(type2)).toBe(false)
    })
  })

  describe('toString()', () => {
    test('should return the string value', () => {
      expect(NodeType.region().toString()).toBe('Region')
      expect(NodeType.area().toString()).toBe('Area')
      expect(NodeType.crag().toString()).toBe('Crag')
      expect(NodeType.sector().toString()).toBe('Sector')
      expect(NodeType.cliff().toString()).toBe('Cliff')
    })
  })

  describe('getValue()', () => {
    test('should return the raw value', () => {
      const nodeType = NodeType.create('Sector')

      expect(nodeType.getValue()).toBe('Sector')
    })
  })
})
