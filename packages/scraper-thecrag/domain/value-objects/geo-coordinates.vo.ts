import { ErrorCodes, OneJsError } from '@OneJs/core'

/**
 * Beta entry structure from TheCrag API.
 */
interface BetaEntry {
  name: string
  markdown: string
}

/**
 * Value Object representing geographic coordinates (latitude/longitude).
 * Encapsulates validation, extraction from various sources, and coordinate operations.
 */
export class GeoCoordinates {
  private constructor(
    private readonly latitude: number,
    private readonly longitude: number,
  ) {}

  /**
   * Creates GeoCoordinates with validation.
   * @throws OneJsError if coordinates are invalid
   */
  static create(latitude: number, longitude: number): GeoCoordinates {
    if (!GeoCoordinates.isValid(latitude, longitude)) {
      throw new OneJsError(
        'Invalid coordinates',
        400,
        `Coordinates (${latitude}, ${longitude}) are out of valid range or invalid`,
        { latitude, longitude },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    return new GeoCoordinates(latitude, longitude)
  }

  /**
   * Creates GeoCoordinates from trusted source (no validation).
   */
  static createFrom(latitude: number, longitude: number): GeoCoordinates {
    return new GeoCoordinates(latitude, longitude)
  }

  /**
   * Validates that coordinates are within reasonable bounds.
   */
  static isValid(lat: number, lng: number): boolean {
    return (
      !Number.isNaN(lat) &&
      !Number.isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180 &&
      // Exclude null island (0,0)
      !(lat === 0 && lng === 0)
    )
  }

  /**
   * Extract coordinates from API response data.
   * Searches multiple possible fields: geometry, map, location, geo, lat/lng, etc.
   */
  static fromApiResponse(data: Record<string, unknown>): GeoCoordinates | null {
    // 1. Try geometry field (standard format)
    const geometryCoords = GeoCoordinates.extractFromGeometry(data.geometry)
    if (geometryCoords) return geometryCoords

    // 2. Try map field
    const mapCoords = GeoCoordinates.extractFromObject(data.map)
    if (mapCoords) return mapCoords

    // 3. Try location field
    const locationCoords = GeoCoordinates.extractFromObject(data.location)
    if (locationCoords) return locationCoords

    // 4. Try geo field
    const geoCoords = GeoCoordinates.extractFromObject(data.geo)
    if (geoCoords) return geoCoords

    // 5. Try direct lat/lng fields
    const directCoords = GeoCoordinates.extractFromObject(data)
    if (directCoords) return directCoords

    // 6. Try geolocation field
    const geolocationCoords = GeoCoordinates.extractFromObject(data.geolocation)
    if (geolocationCoords) return geolocationCoords

    return null
  }

  /**
   * Extract coordinates from geometry object (handles center array format).
   */
  private static extractFromGeometry(geometry: unknown): GeoCoordinates | null {
    if (!geometry || typeof geometry !== 'object') return null

    const geo = geometry as Record<string, unknown>

    // Try direct lat/lng fields
    const lat = geo.lat as number | undefined
    const lng = (geo.long || geo.lng || geo.longitude) as number | undefined
    if (
      lat !== undefined &&
      lng !== undefined &&
      GeoCoordinates.isValid(lat, lng)
    ) {
      return new GeoCoordinates(lat, lng)
    }

    // Try center array format [lng, lat]
    if (geo.center && Array.isArray(geo.center) && geo.center.length >= 2) {
      const centerLat = geo.center[1] as number
      const centerLng = geo.center[0] as number
      if (GeoCoordinates.isValid(centerLat, centerLng)) {
        return new GeoCoordinates(centerLat, centerLng)
      }
    }

    return null
  }

  /**
   * Extract coordinates from a generic object with lat/lng fields.
   */
  private static extractFromObject(obj: unknown): GeoCoordinates | null {
    if (!obj || typeof obj !== 'object') return null

    const data = obj as Record<string, unknown>
    const lat = (data.lat || data.latitude) as number | undefined
    const lng = (data.lng || data.lon || data.long || data.longitude) as
      | number
      | undefined

    if (
      lat !== undefined &&
      lng !== undefined &&
      GeoCoordinates.isValid(lat, lng)
    ) {
      return new GeoCoordinates(lat, lng)
    }

    // Try center format
    if (data.center && Array.isArray(data.center) && data.center.length >= 2) {
      const centerLat = data.center[1] as number
      const centerLng = data.center[0] as number
      if (GeoCoordinates.isValid(centerLat, centerLng)) {
        return new GeoCoordinates(centerLat, centerLng)
      }
    }

    return null
  }

  /**
   * Extract coordinates from beta array (approach, description text).
   * TheCrag often includes parking coordinates like ":parking:, 39.826554, -0.574161"
   */
  static fromBetaText(beta: BetaEntry[] | undefined): GeoCoordinates | null {
    if (!beta || !Array.isArray(beta)) {
      return null
    }

    // Combine all beta text
    const fullText = beta.map((b) => b.markdown || '').join(' ')

    // Pattern 1: :parking:, lat, lng or (lat, lng)
    const parkingCoords = GeoCoordinates.extractParkingPattern(fullText)
    if (parkingCoords) return parkingCoords

    // Pattern 2: Generic coordinate pattern (lat, lng)
    const genericCoords = GeoCoordinates.extractGenericPattern(fullText)
    if (genericCoords) return genericCoords

    // Pattern 3: Google Maps URL in text
    const mapsCoords = GeoCoordinates.extractGoogleMapsPattern(fullText)
    if (mapsCoords) return mapsCoords

    return null
  }

  /**
   * Extract :parking: pattern coordinates.
   */
  private static extractParkingPattern(text: string): GeoCoordinates | null {
    const match = text.match(
      /:parking:[,\s]+(-?\d{1,3}\.\d{3,8})\s*,\s*(-?\d{1,3}\.\d{3,8})/i,
    )
    if (match) {
      const lat = Number.parseFloat(match[1])
      const lng = Number.parseFloat(match[2])
      if (GeoCoordinates.isValid(lat, lng)) {
        return new GeoCoordinates(lat, lng)
      }
    }
    return null
  }

  /**
   * Extract generic coordinate pattern.
   */
  private static extractGenericPattern(text: string): GeoCoordinates | null {
    const matches = text.matchAll(
      /[(\s,](-?\d{1,3}\.\d{4,8})\s*,\s*(-?\d{1,3}\.\d{4,8})[)\s,]/g,
    )
    for (const match of matches) {
      const lat = Number.parseFloat(match[1])
      const lng = Number.parseFloat(match[2])
      // Validate: lat should be reasonable (not too small, indicates it's actually a lat)
      if (GeoCoordinates.isValid(lat, lng) && Math.abs(lat) > 20) {
        return new GeoCoordinates(lat, lng)
      }
    }
    return null
  }

  /**
   * Extract coordinates from Google Maps URL.
   */
  private static extractGoogleMapsPattern(text: string): GeoCoordinates | null {
    // Pattern for google.com/maps?q=lat,lng or google.com/maps/@lat,lng
    const match = text.match(
      /google\.com\/maps[^"'\s]*[?&@=](-?\d+\.?\d*),(-?\d+\.?\d*)/i,
    )
    if (match) {
      const lat = Number.parseFloat(match[1])
      const lng = Number.parseFloat(match[2])
      if (GeoCoordinates.isValid(lat, lng)) {
        return new GeoCoordinates(lat, lng)
      }
    }
    return null
  }

  getLatitude(): number {
    return this.latitude
  }

  getLongitude(): number {
    return this.longitude
  }

  /**
   * Returns a Google Maps URL for these coordinates.
   */
  getGoogleMapsUrl(): string {
    return `https://www.google.com/maps?q=${this.latitude},${this.longitude}`
  }

  equals(other: GeoCoordinates): boolean {
    return (
      this.latitude === other.latitude && this.longitude === other.longitude
    )
  }

  toString(): string {
    return `${this.latitude}, ${this.longitude}`
  }

  toDto(): { lat: number; long: number } {
    return { lat: this.latitude, long: this.longitude }
  }
}
