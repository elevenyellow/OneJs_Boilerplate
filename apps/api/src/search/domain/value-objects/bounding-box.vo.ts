/**
 * Geographic bounding box for spatial queries
 * Represents a rectangular area defined by min/max latitude and longitude
 */
export class BoundingBox {
  private constructor(
    private readonly minLatitude: number,
    private readonly maxLatitude: number,
    private readonly minLongitude: number,
    private readonly maxLongitude: number,
  ) {}

  /**
   * Create bounding box from min/max coordinates
   */
  static create(
    minLatitude: number,
    maxLatitude: number,
    minLongitude: number,
    maxLongitude: number,
  ): BoundingBox {
    return new BoundingBox(minLatitude, maxLatitude, minLongitude, maxLongitude)
  }

  /**
   * Get minimum latitude (south boundary)
   */
  getMinLatitude(): number {
    return this.minLatitude
  }

  /**
   * Get maximum latitude (north boundary)
   */
  getMaxLatitude(): number {
    return this.maxLatitude
  }

  /**
   * Get minimum longitude (west boundary)
   */
  getMinLongitude(): number {
    return this.minLongitude
  }

  /**
   * Get maximum longitude (east boundary)
   */
  getMaxLongitude(): number {
    return this.maxLongitude
  }

  /**
   * String representation for logging
   */
  toString(): string {
    return `lat ${this.minLatitude.toFixed(2)} to ${this.maxLatitude.toFixed(2)}, lng ${this.minLongitude.toFixed(2)} to ${this.maxLongitude.toFixed(2)}`
  }

  /**
   * Get as plain object for Prisma queries
   */
  toPrismaWhere(): {
    latitude: { gte: number; lte: number }
    longitude: { gte: number; lte: number }
  } {
    return {
      latitude: {
        gte: this.minLatitude,
        lte: this.maxLatitude,
      },
      longitude: {
        gte: this.minLongitude,
        lte: this.maxLongitude,
      },
    }
  }
}
