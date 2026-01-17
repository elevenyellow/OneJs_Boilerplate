import { OneJsError, ErrorCodes } from '@OneJs/core'
import type { Coordinates } from '@crags/domain/value-objects'
import { BoundingBox } from './bounding-box.vo'

/**
 * Search radius in kilometers
 * Encapsulates validation and geographic calculations
 */
export class SearchRadius {
  private static readonly MAX_RADIUS_KM = 200

  private constructor(private readonly kilometers: number) {}

  /**
   * Create search radius from kilometers
   */
  static create(kilometers: number): SearchRadius {
    if (kilometers <= 0) {
      throw new OneJsError(
        'Invalid radius',
        400,
        'radius must be greater than 0',
        { radiusKm: kilometers },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    if (kilometers > SearchRadius.MAX_RADIUS_KM) {
      throw new OneJsError(
        'Invalid radius',
        400,
        `radius must be ${SearchRadius.MAX_RADIUS_KM} km or less`,
        { radiusKm: kilometers, max: SearchRadius.MAX_RADIUS_KM },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    return new SearchRadius(kilometers)
  }

  /**
   * Get radius in kilometers
   */
  getKilometers(): number {
    return this.kilometers
  }

  /**
   * Calculate bounding box for geographic search
   * Uses approximate conversion: 1 degree latitude ≈ 111 km
   */
  calculateBoundingBox(center: Coordinates): BoundingBox {
    const lat = center.getLatitude()
    const lng = center.getLongitude()

    if (lat === null || lng === null) {
      throw new OneJsError(
        'Invalid coordinates',
        400,
        'Cannot calculate bounding box with null coordinates',
        { lat, lng },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    // Calculate latitude delta (constant worldwide)
    const latDelta = this.kilometers / 111

    // Calculate longitude delta (varies with latitude)
    const lngDelta = this.kilometers / (111 * Math.cos((lat * Math.PI) / 180))

    return BoundingBox.create(
      lat - latDelta,
      lat + latDelta,
      lng - lngDelta,
      lng + lngDelta,
    )
  }

  toString(): string {
    return `${this.kilometers} km`
  }

  equals(other: SearchRadius): boolean {
    return this.kilometers === other.kilometers
  }
}
