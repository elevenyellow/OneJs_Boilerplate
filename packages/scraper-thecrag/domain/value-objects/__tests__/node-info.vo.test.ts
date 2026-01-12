import { describe, expect, test } from 'bun:test'
import { NodeInfo } from '../node-info.vo'
import { GeoCoordinates } from '../geo-coordinates.vo'
import { UrlStub } from '../url-stub.vo'

describe('NodeInfo Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create NodeInfo with all fields
  // 2. ✓ Create NodeInfo with minimal fields
  // 3. ✓ Get urlStub value
  // 4. ✓ Get urlAncestorStub value
  // 5. ✓ Get headerImageUrl value
  // 6. ✓ Get geometry (GeoCoordinates)
  // 7. ✓ Get googleMapsUrl from geometry
  // 8. ✓ Merge two NodeInfo objects (new values take precedence)
  // 9. ✓ Merge preserves existing values when new are null
  // 10. ✓ Create from raw data object
  // 11. ✓ Convert to DTO for serialization

  test('should create NodeInfo with all fields', () => {
    // Arrange
    const urlStub = UrlStub.create('sector-name')
    const urlAncestorStub = UrlStub.create('spain/valencia/chulilla')
    const headerImageUrl = 'https://static.thecrag.com/image.jpg'
    const geometry = GeoCoordinates.create(39.6687, -0.8967)

    // Act
    const nodeInfo = NodeInfo.create({
      urlStub,
      urlAncestorStub,
      headerImageUrl,
      geometry,
    })

    // Assert
    expect(nodeInfo).toBeInstanceOf(NodeInfo)
  })

  test('should create NodeInfo with minimal fields', () => {
    // Act
    const nodeInfo = NodeInfo.create({})

    // Assert
    expect(nodeInfo).toBeInstanceOf(NodeInfo)
  })

  test('should get urlStub value', () => {
    // Arrange
    const urlStub = UrlStub.create('sector-name')
    const nodeInfo = NodeInfo.create({ urlStub })

    // Act
    const result = nodeInfo.getUrlStub()

    // Assert
    expect(result).toBe(urlStub)
    expect(result?.toString()).toBe('sector-name')
  })

  test('should get urlAncestorStub value', () => {
    // Arrange
    const urlAncestorStub = UrlStub.create('spain/valencia/chulilla')
    const nodeInfo = NodeInfo.create({ urlAncestorStub })

    // Act
    const result = nodeInfo.getUrlAncestorStub()

    // Assert
    expect(result).toBe(urlAncestorStub)
    expect(result?.toString()).toBe('spain/valencia/chulilla')
  })

  test('should get headerImageUrl value', () => {
    // Arrange
    const headerImageUrl = 'https://static.thecrag.com/image.jpg'
    const nodeInfo = NodeInfo.create({ headerImageUrl })

    // Act
    const result = nodeInfo.getHeaderImageUrl()

    // Assert
    expect(result).toBe('https://static.thecrag.com/image.jpg')
  })

  test('should get geometry (GeoCoordinates)', () => {
    // Arrange
    const geometry = GeoCoordinates.create(39.6687, -0.8967)
    const nodeInfo = NodeInfo.create({ geometry })

    // Act
    const result = nodeInfo.getGeometry()

    // Assert
    expect(result).toBe(geometry)
    expect(result?.getLatitude()).toBe(39.6687)
    expect(result?.getLongitude()).toBe(-0.8967)
  })

  test('should get googleMapsUrl from geometry', () => {
    // Arrange
    const geometry = GeoCoordinates.create(39.6687, -0.8967)
    const nodeInfo = NodeInfo.create({ geometry })

    // Act
    const result = nodeInfo.getGoogleMapsUrl()

    // Assert
    expect(result).toBe('https://www.google.com/maps?q=39.6687,-0.8967')
  })

  test('should return null for googleMapsUrl when no geometry', () => {
    // Arrange
    const nodeInfo = NodeInfo.create({})

    // Act
    const result = nodeInfo.getGoogleMapsUrl()

    // Assert
    expect(result).toBeNull()
  })

  test('should merge two NodeInfo objects (new values take precedence)', () => {
    // Arrange
    const original = NodeInfo.create({
      urlStub: UrlStub.create('old-stub'),
      headerImageUrl: 'https://old-image.jpg',
    })
    const newInfo = NodeInfo.create({
      urlStub: UrlStub.create('new-stub'),
      geometry: GeoCoordinates.create(40.0, -1.0),
    })

    // Act
    const merged = original.mergeWith(newInfo)

    // Assert
    expect(merged.getUrlStub()?.toString()).toBe('new-stub')
    expect(merged.getHeaderImageUrl()).toBe('https://old-image.jpg')
    expect(merged.getGeometry()?.getLatitude()).toBe(40.0)
  })

  test('should merge and preserve existing values when new are null', () => {
    // Arrange
    const original = NodeInfo.create({
      urlStub: UrlStub.create('original-stub'),
      urlAncestorStub: UrlStub.create('original-ancestor'),
      headerImageUrl: 'https://original-image.jpg',
      geometry: GeoCoordinates.create(39.6687, -0.8967),
    })
    const newInfo = NodeInfo.create({})

    // Act
    const merged = original.mergeWith(newInfo)

    // Assert
    expect(merged.getUrlStub()?.toString()).toBe('original-stub')
    expect(merged.getUrlAncestorStub()?.toString()).toBe('original-ancestor')
    expect(merged.getHeaderImageUrl()).toBe('https://original-image.jpg')
    expect(merged.getGeometry()?.getLatitude()).toBe(39.6687)
  })

  test('should create from raw data object', () => {
    // Arrange
    const rawData = {
      urlStub: 'sector-name',
      urlAncestorStub: 'spain/valencia',
      headerImageUrl: 'https://image.jpg',
      geometry: { lat: 39.6687, long: -0.8967 },
    }

    // Act
    const nodeInfo = NodeInfo.fromRawData(rawData)

    // Assert
    expect(nodeInfo.getUrlStub()?.toString()).toBe('sector-name')
    expect(nodeInfo.getUrlAncestorStub()?.toString()).toBe('spain/valencia')
    expect(nodeInfo.getHeaderImageUrl()).toBe('https://image.jpg')
    expect(nodeInfo.getGeometry()?.getLatitude()).toBe(39.6687)
  })

  test('should create from raw data with null values', () => {
    // Arrange
    const rawData = {
      urlStub: null,
      geometry: null,
    }

    // Act
    const nodeInfo = NodeInfo.fromRawData(rawData)

    // Assert
    expect(nodeInfo.getUrlStub()).toBeNull()
    expect(nodeInfo.getGeometry()).toBeNull()
  })

  test('should convert to DTO for serialization', () => {
    // Arrange
    const nodeInfo = NodeInfo.create({
      urlStub: UrlStub.create('sector-name'),
      urlAncestorStub: UrlStub.create('spain/valencia'),
      headerImageUrl: 'https://image.jpg',
      geometry: GeoCoordinates.create(39.6687, -0.8967),
    })

    // Act
    const dto = nodeInfo.toDto()

    // Assert
    expect(dto.urlStub).toBe('sector-name')
    expect(dto.urlAncestorStub).toBe('spain/valencia')
    expect(dto.headerImageUrl).toBe('https://image.jpg')
    expect(dto.geometry).toEqual({ lat: 39.6687, long: -0.8967 })
    expect(dto.googleMapsUrl).toBe(
      'https://www.google.com/maps?q=39.6687,-0.8967',
    )
  })

  test('should convert to DTO with null values', () => {
    // Arrange
    const nodeInfo = NodeInfo.create({})

    // Act
    const dto = nodeInfo.toDto()

    // Assert
    expect(dto.urlStub).toBeUndefined()
    expect(dto.urlAncestorStub).toBeUndefined()
    expect(dto.headerImageUrl).toBeUndefined()
    expect(dto.geometry).toBeUndefined()
    expect(dto.googleMapsUrl).toBeUndefined()
  })

  test('should check equality between NodeInfo objects', () => {
    // Arrange
    const nodeInfo1 = NodeInfo.create({
      urlStub: UrlStub.create('sector'),
      headerImageUrl: 'https://image.jpg',
    })
    const nodeInfo2 = NodeInfo.create({
      urlStub: UrlStub.create('sector'),
      headerImageUrl: 'https://image.jpg',
    })
    const nodeInfo3 = NodeInfo.create({
      urlStub: UrlStub.create('different-sector'),
    })

    // Act & Assert
    expect(nodeInfo1.equals(nodeInfo2)).toBe(true)
    expect(nodeInfo1.equals(nodeInfo3)).toBe(false)
  })
})
