export class SectorStats {
  private readonly numberRoutes: number | null
  private readonly numberPhotos: number | null
  private readonly numberTopos: number | null
  private readonly ascentCount: number | null
  private readonly kudos: number | null // Favorites count (merged from totalFavorites)
  private readonly maxPop: number | null
  private readonly subAreaCount: number | null

  private constructor(
    numberRoutes: number | null,
    numberPhotos: number | null,
    numberTopos: number | null,
    ascentCount: number | null,
    kudos: number | null,
    maxPop: number | null,
    subAreaCount: number | null,
  ) {
    this.numberRoutes = numberRoutes
    this.numberPhotos = numberPhotos
    this.numberTopos = numberTopos
    this.ascentCount = ascentCount
    this.kudos = kudos
    this.maxPop = maxPop
    this.subAreaCount = subAreaCount
  }

  static createFrom(
    numberRoutes: number | null | undefined,
    numberPhotos: number | null | undefined,
    numberTopos: number | null | undefined,
    ascentCount: number | null | undefined,
    kudos: number | null | undefined,
    subAreaCount: number | null | undefined,
    maxPop?: number | null | undefined,
  ): SectorStats {
    return new SectorStats(
      numberRoutes ?? null,
      numberPhotos ?? null,
      numberTopos ?? null,
      ascentCount ?? null,
      kudos ?? null,
      maxPop ?? null,
      subAreaCount ?? null,
    )
  }

  static createEmpty(): SectorStats {
    return new SectorStats(null, null, null, null, null, null, null)
  }

  getNumberRoutes(): number | null {
    return this.numberRoutes
  }

  getNumberPhotos(): number | null {
    return this.numberPhotos
  }

  getNumberTopos(): number | null {
    return this.numberTopos
  }

  getAscentCount(): number | null {
    return this.ascentCount
  }

  getKudos(): number | null {
    return this.kudos
  }

  getMaxPop(): number | null {
    return this.maxPop
  }

  getSubAreaCount(): number | null {
    return this.subAreaCount
  }

  hasRoutes(): boolean {
    return this.numberRoutes !== null && this.numberRoutes > 0
  }

  hasSubAreas(): boolean {
    return this.subAreaCount !== null && this.subAreaCount > 0
  }

  equals(other: SectorStats): boolean {
    return (
      this.numberRoutes === other.numberRoutes &&
      this.numberPhotos === other.numberPhotos &&
      this.ascentCount === other.ascentCount &&
      this.kudos === other.kudos &&
      this.maxPop === other.maxPop &&
      this.subAreaCount === other.subAreaCount
    )
  }

  toString(): string {
    return `Routes: ${this.numberRoutes}, SubAreas: ${this.subAreaCount}`
  }

  /**
   * Convert kudos to star rating (1-3 stars)
   * Kudos typically ranges from 0-300+
   * @returns Star rating (1-3) or 0 if no kudos
   */
  getStarRating(): number {
    if (!this.kudos || this.kudos <= 0) return 0

    // Map kudos to 1-3 stars
    if (this.kudos >= 200) return 3 // Excellent
    if (this.kudos >= 100) return 2 // Good
    return 1 // Average
  }
}
