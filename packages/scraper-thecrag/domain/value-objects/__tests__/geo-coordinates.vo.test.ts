import { describe, expect, test } from 'bun:test'
import { GeoCoordinates } from '../geo-coordinates.vo'

describe('GeoCoordinates Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create coordinates with valid lat/lng
  // 2. ✓ Reject invalid latitude (out of bounds)
  // 3. ✓ Reject invalid longitude (out of bounds)
  // 4. ✓ Reject 0,0 coordinates (null island)
  // 5. ✓ Extract from API response with geometry field
  // 6. ✓ Extract from API response with map field
  // 7. ✓ Extract from API response with location field
  // 8. ✓ Extract from API response with direct lat/lng fields
  // 9. ✓ Return null for missing coordinates in API response
  // 10. ✓ Extract coordinates from beta text with :parking: pattern
  // 11. ✓ Extract coordinates from beta text with generic pattern
  // 12. ✓ Extract coordinates from beta text with Google Maps URL
  // 13. ✓ Return null for beta without coordinates
  // 14. ✓ Get Google Maps URL
  // 15. ✓ Equals comparison

  test('should create coordinates with valid lat/lng', () => {
    const coords = GeoCoordinates.create(39.826554, -0.574161)

    expect(coords).toBeInstanceOf(GeoCoordinates)
    expect(coords.getLatitude()).toBe(39.826554)
    expect(coords.getLongitude()).toBe(-0.574161)
  })

  test('should reject invalid latitude (out of bounds)', () => {
    expect(() => GeoCoordinates.create(91, 0)).toThrow()
    expect(() => GeoCoordinates.create(-91, 0)).toThrow()
  })

  test('should reject invalid longitude (out of bounds)', () => {
    expect(() => GeoCoordinates.create(0, 181)).toThrow()
    expect(() => GeoCoordinates.create(0, -181)).toThrow()
  })

  test('should reject 0,0 coordinates (null island)', () => {
    expect(() => GeoCoordinates.create(0, 0)).toThrow()
  })

  test('should extract from API response with geometry field', () => {
    const data = {
      geometry: { lat: 39.826554, long: -0.574161 },
    }

    const coords = GeoCoordinates.fromApiResponse(data)

    expect(coords).not.toBeNull()
    expect(coords!.getLatitude()).toBe(39.826554)
    expect(coords!.getLongitude()).toBe(-0.574161)
  })

  test('should extract from API response with geometry center array', () => {
    const data = {
      geometry: { center: [-0.574161, 39.826554] }, // [lng, lat] format
    }

    const coords = GeoCoordinates.fromApiResponse(data)

    expect(coords).not.toBeNull()
    expect(coords!.getLatitude()).toBe(39.826554)
    expect(coords!.getLongitude()).toBe(-0.574161)
  })

  test('should extract from API response with map field', () => {
    const data = {
      map: { lat: 40.123, lng: -3.456 },
    }

    const coords = GeoCoordinates.fromApiResponse(data)

    expect(coords).not.toBeNull()
    expect(coords!.getLatitude()).toBe(40.123)
    expect(coords!.getLongitude()).toBe(-3.456)
  })

  test('should extract from API response with location field', () => {
    const data = {
      location: { latitude: 41.5, longitude: 2.1 },
    }

    const coords = GeoCoordinates.fromApiResponse(data)

    expect(coords).not.toBeNull()
    expect(coords!.getLatitude()).toBe(41.5)
    expect(coords!.getLongitude()).toBe(2.1)
  })

  test('should extract from API response with direct lat/lng fields', () => {
    const data = {
      lat: 42.0,
      lng: 1.5,
    }

    const coords = GeoCoordinates.fromApiResponse(data)

    expect(coords).not.toBeNull()
    expect(coords!.getLatitude()).toBe(42.0)
    expect(coords!.getLongitude()).toBe(1.5)
  })

  test('should return null for missing coordinates in API response', () => {
    const data = { name: 'Some area' }

    const coords = GeoCoordinates.fromApiResponse(data)

    expect(coords).toBeNull()
  })

  test('should extract coordinates from beta text with :parking: pattern', () => {
    const beta = [
      { name: 'approach', markdown: 'Park at :parking:, 39.826554, -0.574161' },
    ]

    const coords = GeoCoordinates.fromBetaText(beta)

    expect(coords).not.toBeNull()
    expect(coords!.getLatitude()).toBe(39.826554)
    expect(coords!.getLongitude()).toBe(-0.574161)
  })

  test('should extract coordinates from beta text with generic pattern', () => {
    const beta = [
      {
        name: 'description',
        markdown: 'The crag is located at (40.1234, -3.5678)',
      },
    ]

    const coords = GeoCoordinates.fromBetaText(beta)

    expect(coords).not.toBeNull()
    expect(coords!.getLatitude()).toBe(40.1234)
    expect(coords!.getLongitude()).toBe(-3.5678)
  })

  test('should extract coordinates from beta text with Google Maps URL', () => {
    const beta = [
      {
        name: 'approach',
        markdown:
          'See map: https://google.com/maps?q=41.2345,-2.3456 for parking',
      },
    ]

    const coords = GeoCoordinates.fromBetaText(beta)

    expect(coords).not.toBeNull()
    expect(coords!.getLatitude()).toBe(41.2345)
    expect(coords!.getLongitude()).toBe(-2.3456)
  })

  test('should return null for beta without coordinates', () => {
    const beta = [
      { name: 'description', markdown: 'A nice crag with good routes' },
    ]

    const coords = GeoCoordinates.fromBetaText(beta)

    expect(coords).toBeNull()
  })

  test('should return null for undefined beta', () => {
    const coords = GeoCoordinates.fromBetaText(undefined)

    expect(coords).toBeNull()
  })

  test('should get Google Maps URL', () => {
    const coords = GeoCoordinates.create(39.826554, -0.574161)

    expect(coords.getGoogleMapsUrl()).toBe(
      'https://www.google.com/maps?q=39.826554,-0.574161',
    )
  })

  test('should compare two coordinates for equality', () => {
    const coords1 = GeoCoordinates.create(39.826554, -0.574161)
    const coords2 = GeoCoordinates.create(39.826554, -0.574161)
    const coords3 = GeoCoordinates.create(40.0, -0.574161)

    expect(coords1.equals(coords2)).toBe(true)
    expect(coords1.equals(coords3)).toBe(false)
  })

  test('should convert to string', () => {
    const coords = GeoCoordinates.create(39.826554, -0.574161)

    expect(coords.toString()).toBe('39.826554, -0.574161')
  })

  test('should convert to DTO', () => {
    const coords = GeoCoordinates.create(39.826554, -0.574161)
    const dto = coords.toDto()

    expect(dto).toEqual({ lat: 39.826554, long: -0.574161 })
  })
})
