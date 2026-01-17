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
        throw new Error(
          `Invalid latitude: ${latitude}. Must be between -90 and 90`,
        )
      }
    }
    if (longitude !== null && longitude !== undefined) {
      if (longitude < -180 || longitude > 180) {
        throw new Error(
          `Invalid longitude: ${longitude}. Must be between -180 and 180`,
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
