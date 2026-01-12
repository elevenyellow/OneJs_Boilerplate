import { describe, expect, test } from 'bun:test'
import { ChildNode } from '../child-node.vo'
import { NodeId } from '../node-id.vo'
import { NodeType } from '../node-type.vo'

describe('ChildNode Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. Create ChildNode from API array item with all fields
  // 2. Create ChildNode from API array item with minimal fields
  // 3. Get NodeId correctly
  // 4. Get name correctly
  // 5. Get type correctly (defaults to Area)
  // 6. Get urlStub correctly
  // 7. Get urlAncestorStub correctly
  // 8. Get geometry correctly
  // 9. Handle missing optional fields
  // 10. Handle null/undefined in array items

  // API array format: [id, name, urlStub, urlAncestorStub, subAreaCount, subType, asciiName, approach, map, geo, location, geolocation, geometry, ...]
  const fullApiArrayItem = [
    12345, // id (index 0)
    'Sector Norte', // name (index 1)
    'sector-norte', // urlStub (index 2)
    'spain/valencia/montanejos', // urlAncestorStub (index 3)
    5, // subAreaCount (index 4)
    'Sector', // subType (index 5)
    'sector-norte', // asciiName (index 6)
    'Easy approach', // approach (index 7)
    null, // map (index 8)
    null, // geo (index 9)
    null, // location (index 10)
    null, // geolocation (index 11)
    { lat: 40.0634, long: -0.5281 }, // geometry (index 12)
  ]

  const minimalApiArrayItem = [
    67890, // id
    'Simple Area', // name
    null, // urlStub
    null, // urlAncestorStub
    0, // subAreaCount
    null, // subType (should default to 'Area')
  ]

  test('should create ChildNode from API array item with all fields', () => {
    // Act
    const childNode = ChildNode.fromApiArrayItem(fullApiArrayItem)

    // Assert
    expect(childNode).toBeInstanceOf(ChildNode)
    expect(childNode.getId().getValue()).toBe(12345)
    expect(childNode.getName()).toBe('Sector Norte')
    expect(childNode.getType()).toBeInstanceOf(NodeType)
    expect(childNode.getType().isSector()).toBe(true)
  })

  test('should create ChildNode from API array item with minimal fields', () => {
    // Act
    const childNode = ChildNode.fromApiArrayItem(minimalApiArrayItem)

    // Assert
    expect(childNode).toBeInstanceOf(ChildNode)
    expect(childNode.getId().getValue()).toBe(67890)
    expect(childNode.getName()).toBe('Simple Area')
  })

  test('should get NodeId correctly', () => {
    // Arrange
    const childNode = ChildNode.fromApiArrayItem(fullApiArrayItem)

    // Act
    const nodeId = childNode.getId()

    // Assert
    expect(nodeId).toBeInstanceOf(NodeId)
    expect(nodeId.getValue()).toBe(12345)
    expect(nodeId.toString()).toBe('12345')
  })

  test('should get name correctly', () => {
    // Arrange
    const childNode = ChildNode.fromApiArrayItem(fullApiArrayItem)

    // Act & Assert
    expect(childNode.getName()).toBe('Sector Norte')
  })

  test('should get type correctly as NodeType value object', () => {
    // Arrange
    const childNode = ChildNode.fromApiArrayItem(fullApiArrayItem)

    // Act
    const type = childNode.getType()

    // Assert
    expect(type).toBeInstanceOf(NodeType)
    expect(type.isSector()).toBe(true)
    expect(type.toString()).toBe('Sector')
  })

  test('should default type to Area when subType is null', () => {
    // Arrange
    const childNode = ChildNode.fromApiArrayItem(minimalApiArrayItem)

    // Act
    const type = childNode.getType()

    // Assert
    expect(type).toBeInstanceOf(NodeType)
    expect(type.isArea()).toBe(true)
    expect(type.toString()).toBe('Area')
  })

  test('should get urlStub correctly', () => {
    // Arrange
    const childNode = ChildNode.fromApiArrayItem(fullApiArrayItem)

    // Act & Assert
    expect(childNode.getUrlStub()).toBe('sector-norte')
  })

  test('should return null for missing urlStub', () => {
    // Arrange
    const childNode = ChildNode.fromApiArrayItem(minimalApiArrayItem)

    // Act & Assert
    expect(childNode.getUrlStub()).toBeNull()
  })

  test('should get urlAncestorStub correctly', () => {
    // Arrange
    const childNode = ChildNode.fromApiArrayItem(fullApiArrayItem)

    // Act & Assert
    expect(childNode.getUrlAncestorStub()).toBe('spain/valencia/montanejos')
  })

  test('should return null for missing urlAncestorStub', () => {
    // Arrange
    const childNode = ChildNode.fromApiArrayItem(minimalApiArrayItem)

    // Act & Assert
    expect(childNode.getUrlAncestorStub()).toBeNull()
  })

  test('should get geometry correctly', () => {
    // Arrange
    const childNode = ChildNode.fromApiArrayItem(fullApiArrayItem)

    // Act
    const geometry = childNode.getGeometry()

    // Assert
    expect(geometry).not.toBeNull()
    expect(geometry?.lat).toBe(40.0634)
    expect(geometry?.long).toBe(-0.5281)
  })

  test('should return null for missing geometry', () => {
    // Arrange
    const childNode = ChildNode.fromApiArrayItem(minimalApiArrayItem)

    // Act & Assert
    expect(childNode.getGeometry()).toBeNull()
  })

  test('should check if has geometry', () => {
    // Arrange
    const withGeometry = ChildNode.fromApiArrayItem(fullApiArrayItem)
    const withoutGeometry = ChildNode.fromApiArrayItem(minimalApiArrayItem)

    // Act & Assert
    expect(withGeometry.hasGeometry()).toBe(true)
    expect(withoutGeometry.hasGeometry()).toBe(false)
  })

  test('should check if has urlStub', () => {
    // Arrange
    const withUrl = ChildNode.fromApiArrayItem(fullApiArrayItem)
    const withoutUrl = ChildNode.fromApiArrayItem(minimalApiArrayItem)

    // Act & Assert
    expect(withUrl.hasUrlStub()).toBe(true)
    expect(withoutUrl.hasUrlStub()).toBe(false)
  })

  test('should compare equality by id', () => {
    // Arrange
    const child1 = ChildNode.fromApiArrayItem(fullApiArrayItem)
    const child2 = ChildNode.fromApiArrayItem(fullApiArrayItem)
    const child3 = ChildNode.fromApiArrayItem(minimalApiArrayItem)

    // Act & Assert
    expect(child1.equals(child2)).toBe(true)
    expect(child1.equals(child3)).toBe(false)
  })

  test('should convert to string representation', () => {
    // Arrange
    const childNode = ChildNode.fromApiArrayItem(fullApiArrayItem)

    // Act
    const str = childNode.toString()

    // Assert
    expect(str).toContain('12345')
    expect(str).toContain('Sector Norte')
    expect(str).toContain('Sector')
  })
})
