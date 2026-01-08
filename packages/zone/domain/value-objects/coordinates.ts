export class Coordinates {
  constructor(
    public readonly latitude: number,
    public readonly longitude: number,
  ) {
    this.validate()
  }

  private validate(): void {
    if (this.latitude < -90 || this.latitude > 90) {
      throw new Error('Latitude must be between -90 and 90')
    }
    if (this.longitude < -180 || this.longitude > 180) {
      throw new Error('Longitude must be between -180 and 180')
    }
  }

  /**
   * Calculate distance to another coordinate in kilometers using Haversine formula
   */
  distanceTo(other: Coordinates): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRad(other.latitude - this.latitude)
    const dLon = this.toRad(other.longitude - this.longitude)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(this.latitude)) *
        Math.cos(this.toRad(other.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180)
  }

  toJSON(): { latitude: number; longitude: number } {
    return {
      latitude: this.latitude,
      longitude: this.longitude,
    }
  }

  static fromJSON(data: { latitude: number; longitude: number }): Coordinates {
    return new Coordinates(data.latitude, data.longitude)
  }
}
