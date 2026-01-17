import { OneJsError } from '@OneJs/core'

export class Coordinates {
  private readonly latitude: number | null
  private readonly longitude: number | null

  private constructor(latitude: number | null, longitude: number | null) {
    this.latitude = latitude
    this.longitude = longitude
  }

  static createFrom(
    latitude: number | null | undefined,
    longitude: number | null | undefined,
  ): Coordinates {
    if (latitude !== null && latitude !== undefined) {
      if (latitude < -90 || latitude > 90) {
        throw new OneJsError(
          'INVALID_LATITUDE',
          400,
          `Latitude ${latitude} must be between -90 and 90`,
        )
      }
    }
    if (longitude !== null && longitude !== undefined) {
      if (longitude < -180 || longitude > 180) {
        throw new OneJsError(
          'INVALID_LONGITUDE',
          400,
          `Longitude ${longitude} must be between -180 and 180`,
        )
      }
    }
    return new Coordinates(latitude ?? null, longitude ?? null)
  }

  static createEmpty(): Coordinates {
    return new Coordinates(null, null)
  }

  getLatitude(): number | null {
    return this.latitude
  }

  getLongitude(): number | null {
    return this.longitude
  }

  hasCoordinates(): boolean {
    return this.latitude !== null && this.longitude !== null
  }

  toArray(): [number, number] | null {
    if (!this.hasCoordinates()) return null
    return [this.latitude!, this.longitude!]
  }

  distanceTo(other: Coordinates): number | null {
    if (!this.hasCoordinates() || !other.hasCoordinates()) return null

    const R = 6371 // Radio de la Tierra en km
    const dLat = this.toRad(other.latitude! - this.latitude!)
    const dLon = this.toRad(other.longitude! - this.longitude!)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(this.latitude!)) *
        Math.cos(this.toRad(other.latitude!)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180)
  }

  equals(other: Coordinates): boolean {
    return (
      this.latitude === other.latitude && this.longitude === other.longitude
    )
  }

  toString(): string {
    if (!this.hasCoordinates()) return ''
    return `${this.latitude},${this.longitude}`
  }
}
