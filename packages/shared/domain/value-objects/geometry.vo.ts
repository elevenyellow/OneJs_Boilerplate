import { Coordinates } from './coordinates.vo'

/**
 * Bounding box as [minLon, minLat, maxLon, maxLat]
 */
export type BoundingBox = [string, string, string, string]

/**
 * Polygon boundary as array of coordinate pairs
 */
export type Boundary = number[][][]

export interface GeometryData {
  lat?: number
  long?: number
  center?: [number, number]
  bbox?: BoundingBox
  boundary?: Boundary
  areasize?: number
  point?: [string, string]
}

/**
 * Value Object representing geographical geometry from TheCrag
 * Includes center point, bounding box, and boundary polygon
 */
export class Geometry {
  constructor(
    public readonly lat: number | null,
    public readonly long: number | null,
    public readonly center: [number, number] | null,
    public readonly bbox: BoundingBox | null,
    public readonly boundary: Boundary | null,
    public readonly areasize: number | null,
    public readonly point: [string, string] | null,
  ) {}

  /**
   * Get coordinates from the geometry (prefers lat/long, falls back to center)
   */
  getCoordinates(): Coordinates | null {
    if (this.lat !== null && this.long !== null) {
      return new Coordinates(this.lat, this.long)
    }
    if (this.center) {
      return new Coordinates(this.center[1], this.center[0])
    }
    return null
  }

  /**
   * Get Google Maps URL for this location
   */
  getGoogleMapsUrl(): string | null {
    const coords = this.getCoordinates()
    if (!coords) return null
    return `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`
  }

  toJSON(): GeometryData {
    return {
      lat: this.lat ?? undefined,
      long: this.long ?? undefined,
      center: this.center ?? undefined,
      bbox: this.bbox ?? undefined,
      boundary: this.boundary ?? undefined,
      areasize: this.areasize ?? undefined,
      point: this.point ?? undefined,
    }
  }

  static fromJSON(data: GeometryData | null | undefined): Geometry | null {
    if (!data) return null

    return new Geometry(
      data.lat ?? null,
      data.long ?? null,
      data.center ?? null,
      data.bbox ?? null,
      data.boundary ?? null,
      data.areasize ?? null,
      data.point ?? null,
    )
  }

  static empty(): Geometry {
    return new Geometry(null, null, null, null, null, null, null)
  }
}
