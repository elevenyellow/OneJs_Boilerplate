/**
 * Input for height stats creation
 */
export interface HeightStatsInput {
  totalRoutes: number
  averageHeight?: number
  averageHeightUnit?: string
  maxHeight?: number
  totalClimbableMeters?: number
  multiPitchCount?: number
  singlePitchCount?: number
  averagePitches?: number
}

/**
 * Serialized height stats
 */
export interface HeightStatsPrimitives {
  totalRoutes: number
  averageHeight: number
  averageHeightUnit: string
  maxHeight: number
  totalClimbableMeters: number
  multiPitchCount: number
  multiPitchPercentage: number
  singlePitchCount: number
  singlePitchPercentage: number
  averagePitches: number
  isMultiPitchFocused: boolean
  hasTallRoutes: boolean
}

/**
 * Thresholds for height classification
 */
const HEIGHT_THRESHOLDS = {
  MULTI_PITCH_FOCUSED_PERCENTAGE: 30, // >30% multi-pitch = multi-pitch focused
  TALL_ROUTE_AVERAGE: 30, // Average height > 30m = tall routes
} as const

/**
 * Value object representing height and pitch statistics for a sector or area.
 * Tracks route heights, multi-pitch counts, and vertical meters.
 */
export class HeightStats {
  private readonly totalRoutes: number
  private readonly averageHeight: number
  private readonly averageHeightUnit: string
  private readonly maxHeight: number
  private readonly totalClimbableMeters: number
  private readonly multiPitchCount: number
  private readonly singlePitchCount: number
  private readonly averagePitches: number

  private constructor(
    totalRoutes: number,
    averageHeight: number,
    averageHeightUnit: string,
    maxHeight: number,
    totalClimbableMeters: number,
    multiPitchCount: number,
    singlePitchCount: number,
    averagePitches: number,
  ) {
    this.totalRoutes = totalRoutes
    this.averageHeight = averageHeight
    this.averageHeightUnit = averageHeightUnit
    this.maxHeight = maxHeight
    this.totalClimbableMeters = totalClimbableMeters
    this.multiPitchCount = multiPitchCount
    this.singlePitchCount = singlePitchCount
    this.averagePitches = averagePitches
  }

  /**
   * Creates height stats from input data
   */
  static createFrom(data: HeightStatsInput | null | undefined): HeightStats {
    if (!data) {
      return HeightStats.createEmpty()
    }

    return new HeightStats(
      data.totalRoutes,
      data.averageHeight ?? 0,
      data.averageHeightUnit ?? 'm',
      data.maxHeight ?? 0,
      data.totalClimbableMeters ?? 0,
      data.multiPitchCount ?? 0,
      data.singlePitchCount ?? 0,
      data.averagePitches ?? 1,
    )
  }

  /**
   * Creates empty height stats
   */
  static createEmpty(): HeightStats {
    return new HeightStats(0, 0, 'm', 0, 0, 0, 0, 1)
  }

  // ============================================================================
  // BASIC METRICS
  // ============================================================================

  getTotalRoutes(): number {
    return this.totalRoutes
  }

  isEmpty(): boolean {
    return this.totalRoutes === 0
  }

  // ============================================================================
  // HEIGHT METRICS
  // ============================================================================

  getAverageHeight(): number {
    return this.averageHeight
  }

  getAverageHeightUnit(): string {
    return this.averageHeightUnit
  }

  getMaxHeight(): number {
    return this.maxHeight
  }

  getTotalClimbableMeters(): number {
    return this.totalClimbableMeters
  }

  // ============================================================================
  // PITCH METRICS
  // ============================================================================

  getMultiPitchCount(): number {
    return this.multiPitchCount
  }

  getMultiPitchPercentage(): number {
    if (this.totalRoutes === 0) return 0
    return Math.round((this.multiPitchCount / this.totalRoutes) * 100)
  }

  getSinglePitchCount(): number {
    return this.singlePitchCount
  }

  getSinglePitchPercentage(): number {
    if (this.totalRoutes === 0) return 0
    return Math.round((this.singlePitchCount / this.totalRoutes) * 100)
  }

  getAveragePitches(): number {
    return this.averagePitches
  }

  // ============================================================================
  // ANALYSIS
  // ============================================================================

  /**
   * Check if sector is focused on multi-pitch climbing
   */
  isMultiPitchFocused(): boolean {
    return (
      this.getMultiPitchPercentage() >=
      HEIGHT_THRESHOLDS.MULTI_PITCH_FOCUSED_PERCENTAGE
    )
  }

  /**
   * Check if sector has tall routes on average
   */
  hasTallRoutes(): boolean {
    return this.averageHeight >= HEIGHT_THRESHOLDS.TALL_ROUTE_AVERAGE
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  toPrimitives(): HeightStatsPrimitives {
    return {
      totalRoutes: this.totalRoutes,
      averageHeight: this.averageHeight,
      averageHeightUnit: this.averageHeightUnit,
      maxHeight: this.maxHeight,
      totalClimbableMeters: this.totalClimbableMeters,
      multiPitchCount: this.multiPitchCount,
      multiPitchPercentage: this.getMultiPitchPercentage(),
      singlePitchCount: this.singlePitchCount,
      singlePitchPercentage: this.getSinglePitchPercentage(),
      averagePitches: this.averagePitches,
      isMultiPitchFocused: this.isMultiPitchFocused(),
      hasTallRoutes: this.hasTallRoutes(),
    }
  }

  // ============================================================================
  // EQUALITY
  // ============================================================================

  equals(other: HeightStats): boolean {
    return (
      this.totalRoutes === other.totalRoutes &&
      this.averageHeight === other.averageHeight &&
      this.maxHeight === other.maxHeight &&
      this.multiPitchCount === other.multiPitchCount
    )
  }

  toString(): string {
    return `HeightStats(avg=${this.averageHeight}${this.averageHeightUnit}, max=${this.maxHeight})`
  }
}
