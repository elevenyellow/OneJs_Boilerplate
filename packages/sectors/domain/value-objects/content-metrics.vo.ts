/**
 * Input for content metrics creation
 */
export interface ContentMetricsInput {
  totalRoutes: number
  routesWithTopo: number
  routesWithPhotos: number
  totalPhotos: number
  hasApproachInfo: boolean
  hasBetaInfo: boolean
  hasDescription: boolean
  hasCoordinates: boolean
}

/**
 * Serialized content metrics
 */
export interface ContentMetricsPrimitives {
  totalRoutes: number
  routesWithTopo: number
  routesWithPhotos: number
  totalPhotos: number
  toposCoverage: number
  photosDensity: number
  hasApproachInfo: boolean
  hasBetaInfo: boolean
  hasDescription: boolean
  hasCoordinates: boolean
  informationCompleteness: number
  isWellDocumented: boolean
}

/**
 * Thresholds for content quality classification
 */
const CONTENT_THRESHOLDS = {
  WELL_DOCUMENTED_TOPO_COVERAGE: 70, // 70%+ routes with topo
  WELL_DOCUMENTED_COMPLETENESS: 60, // 60%+ overall completeness
  MIN_PHOTOS_DENSITY: 0.5, // At least 0.5 photos per route for good coverage
} as const

/**
 * Weights for calculating information completeness score
 */
const COMPLETENESS_WEIGHTS = {
  TOPOS_COVERAGE: 30, // 30% weight - most important for climbers
  PHOTOS_COVERAGE: 15, // 15% weight
  APPROACH_INFO: 20, // 20% weight - important for access
  BETA_INFO: 10, // 10% weight
  DESCRIPTION: 15, // 15% weight
  COORDINATES: 10, // 10% weight - GPS location
} as const

/**
 * Value object representing content and documentation metrics for a sector.
 * Tracks completeness of information, topo coverage, photos, and other content.
 */
export class ContentMetrics {
  private readonly totalRoutes: number
  private readonly routesWithTopo: number
  private readonly routesWithPhotos: number
  private readonly totalPhotos: number
  private readonly hasApproachInfo: boolean
  private readonly hasBetaInfo: boolean
  private readonly hasDescription: boolean
  private readonly hasCoordinates: boolean

  private constructor(
    totalRoutes: number,
    routesWithTopo: number,
    routesWithPhotos: number,
    totalPhotos: number,
    hasApproachInfo: boolean,
    hasBetaInfo: boolean,
    hasDescription: boolean,
    hasCoordinates: boolean,
  ) {
    this.totalRoutes = totalRoutes
    this.routesWithTopo = routesWithTopo
    this.routesWithPhotos = routesWithPhotos
    this.totalPhotos = totalPhotos
    this.hasApproachInfo = hasApproachInfo
    this.hasBetaInfo = hasBetaInfo
    this.hasDescription = hasDescription
    this.hasCoordinates = hasCoordinates
  }

  /**
   * Creates content metrics from input data
   */
  static createFrom(
    data: ContentMetricsInput | null | undefined,
  ): ContentMetrics {
    if (!data) {
      return ContentMetrics.createEmpty()
    }

    return new ContentMetrics(
      data.totalRoutes,
      data.routesWithTopo,
      data.routesWithPhotos,
      data.totalPhotos,
      data.hasApproachInfo,
      data.hasBetaInfo,
      data.hasDescription,
      data.hasCoordinates,
    )
  }

  /**
   * Creates empty content metrics
   */
  static createEmpty(): ContentMetrics {
    return new ContentMetrics(0, 0, 0, 0, false, false, false, false)
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  getTotalRoutes(): number {
    return this.totalRoutes
  }

  getRoutesWithTopo(): number {
    return this.routesWithTopo
  }

  getRoutesWithPhotos(): number {
    return this.routesWithPhotos
  }

  getTotalPhotos(): number {
    return this.totalPhotos
  }

  // ============================================================================
  // COVERAGE CALCULATIONS
  // ============================================================================

  /**
   * Get percentage of routes with topo (0-100)
   */
  getToposCoverage(): number {
    if (this.totalRoutes === 0) return 0
    return Math.round((this.routesWithTopo / this.totalRoutes) * 100)
  }

  /**
   * Get average photos per route
   */
  getPhotosDensity(): number {
    if (this.totalRoutes === 0) return 0
    return Math.round((this.totalPhotos / this.totalRoutes) * 10) / 10
  }

  /**
   * Get percentage of routes with photos (0-100)
   */
  getPhotosCoverage(): number {
    if (this.totalRoutes === 0) return 0
    return Math.round((this.routesWithPhotos / this.totalRoutes) * 100)
  }

  // ============================================================================
  // CONTENT FLAGS
  // ============================================================================

  hasTopos(): boolean {
    return this.routesWithTopo > 0
  }

  hasPhotos(): boolean {
    return this.totalPhotos > 0
  }

  getHasApproachInfo(): boolean {
    return this.hasApproachInfo
  }

  getHasBetaInfo(): boolean {
    return this.hasBetaInfo
  }

  getHasDescription(): boolean {
    return this.hasDescription
  }

  getHasCoordinates(): boolean {
    return this.hasCoordinates
  }

  // ============================================================================
  // COMPLETENESS SCORE
  // ============================================================================

  /**
   * Calculate overall information completeness score (0-100)
   * Based on weighted combination of various content metrics
   */
  getInformationCompleteness(): number {
    let score = 0

    // Topos coverage (30% weight) - normalized to 0-100
    const topoCoverageScore = this.getToposCoverage()
    score += (topoCoverageScore / 100) * COMPLETENESS_WEIGHTS.TOPOS_COVERAGE

    // Photos coverage (15% weight)
    const photosCoverageScore = Math.min(this.getPhotosCoverage(), 100)
    score += (photosCoverageScore / 100) * COMPLETENESS_WEIGHTS.PHOTOS_COVERAGE

    // Approach info (20% weight)
    if (this.hasApproachInfo) {
      score += COMPLETENESS_WEIGHTS.APPROACH_INFO
    }

    // Beta info (10% weight)
    if (this.hasBetaInfo) {
      score += COMPLETENESS_WEIGHTS.BETA_INFO
    }

    // Description (15% weight)
    if (this.hasDescription) {
      score += COMPLETENESS_WEIGHTS.DESCRIPTION
    }

    // Coordinates (10% weight)
    if (this.hasCoordinates) {
      score += COMPLETENESS_WEIGHTS.COORDINATES
    }

    return Math.round(score)
  }

  /**
   * Check if sector is well-documented based on content coverage
   */
  isWellDocumented(): boolean {
    const topoCoverage = this.getToposCoverage()
    const completeness = this.getInformationCompleteness()

    return (
      topoCoverage >= CONTENT_THRESHOLDS.WELL_DOCUMENTED_TOPO_COVERAGE ||
      completeness >= CONTENT_THRESHOLDS.WELL_DOCUMENTED_COMPLETENESS
    )
  }

  // ============================================================================
  // EMPTY CHECK
  // ============================================================================

  isEmpty(): boolean {
    return (
      this.totalRoutes === 0 &&
      this.routesWithTopo === 0 &&
      this.totalPhotos === 0 &&
      !this.hasApproachInfo &&
      !this.hasBetaInfo &&
      !this.hasDescription &&
      !this.hasCoordinates
    )
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  toPrimitives(): ContentMetricsPrimitives {
    return {
      totalRoutes: this.totalRoutes,
      routesWithTopo: this.routesWithTopo,
      routesWithPhotos: this.routesWithPhotos,
      totalPhotos: this.totalPhotos,
      toposCoverage: this.getToposCoverage(),
      photosDensity: this.getPhotosDensity(),
      hasApproachInfo: this.hasApproachInfo,
      hasBetaInfo: this.hasBetaInfo,
      hasDescription: this.hasDescription,
      hasCoordinates: this.hasCoordinates,
      informationCompleteness: this.getInformationCompleteness(),
      isWellDocumented: this.isWellDocumented(),
    }
  }

  // ============================================================================
  // EQUALITY
  // ============================================================================

  equals(other: ContentMetrics): boolean {
    return (
      this.totalRoutes === other.totalRoutes &&
      this.routesWithTopo === other.routesWithTopo &&
      this.totalPhotos === other.totalPhotos &&
      this.hasApproachInfo === other.hasApproachInfo &&
      this.hasBetaInfo === other.hasBetaInfo &&
      this.hasDescription === other.hasDescription &&
      this.hasCoordinates === other.hasCoordinates
    )
  }

  toString(): string {
    return `ContentMetrics(completeness=${this.getInformationCompleteness()}%, topos=${this.getToposCoverage()}%)`
  }
}
