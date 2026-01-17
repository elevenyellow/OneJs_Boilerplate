import { OneJsError, ErrorCodes } from '@OneJs/core'

export class Coordinates {
  private readonly _latitude: number
  private readonly _longitude: number

  private constructor(latitude: number, longitude: number) {
    this._latitude = latitude
    this._longitude = longitude
  }

  static create(latitude: number, longitude: number): Coordinates {
    if (!Coordinates.isValidLatitude(latitude)) {
      throw new OneJsError(
        'Invalid latitude',
        400,
        `Latitude ${latitude} must be between -90 and 90`,
        { latitude },
        ErrorCodes.VALIDATION_FAILED,
      )
    }
    if (!Coordinates.isValidLongitude(longitude)) {
      throw new OneJsError(
        'Invalid longitude',
        400,
        `Longitude ${longitude} must be between -180 and 180`,
        { longitude },
        ErrorCodes.VALIDATION_FAILED,
      )
    }
    return new Coordinates(latitude, longitude)
  }

  private static isValidLatitude(lat: number): boolean {
    return lat >= -90 && lat <= 90
  }

  private static isValidLongitude(lon: number): boolean {
    return lon >= -180 && lon <= 180
  }

  get latitude(): number {
    return this._latitude
  }

  get longitude(): number {
    return this._longitude
  }

  toMeteoblueFormat(): string {
    const latSuffix = this._latitude >= 0 ? 'N' : 'S'
    const lonSuffix = this._longitude >= 0 ? 'E' : 'W'
    const absLat = Math.abs(this._latitude).toFixed(2)
    const absLon = Math.abs(this._longitude).toFixed(2)
    return `${absLat}${latSuffix}${absLon}${lonSuffix}`
  }

  toCacheKey(): string {
    return `${this._latitude.toFixed(4)}_${this._longitude.toFixed(4)}`
  }

  equals(other: Coordinates): boolean {
    return (
      this._latitude === other._latitude && this._longitude === other._longitude
    )
  }

  toString(): string {
    return `(${this._latitude}, ${this._longitude})`
  }

  toJSON(): { latitude: number; longitude: number } {
    return {
      latitude: this._latitude,
      longitude: this._longitude,
    }
  }
}
