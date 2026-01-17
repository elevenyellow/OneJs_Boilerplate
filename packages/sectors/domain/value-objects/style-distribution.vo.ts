/**
 * Climbing style types
 */
export type ClimbingStyleType =
  | 'sport'
  | 'trad'
  | 'boulder'
  | 'aid'
  | 'alpine'
  | 'mixed'
  | 'ice'
  | 'topRope'
  | 'unknown'

/**
 * Input for style distribution creation
 */
export interface StyleCountsInput {
  sport?: number
  trad?: number
  boulder?: number
  aid?: number
  alpine?: number
  mixed?: number
  ice?: number
  topRope?: number
}

/**
 * Style entry with count and percentage
 */
export interface StyleEntry {
  style: ClimbingStyleType
  count: number
  percentage: number
}

/**
 * Serialized style distribution
 */
export interface StyleDistributionPrimitives {
  totalRoutes: number
  sportCount: number
  tradCount: number
  boulderCount: number
  aidCount: number
  alpineCount: number
  mixedCount: number
  iceCount: number
  topRopeCount: number
  sportPercentage: number
  tradPercentage: number
  boulderPercentage: number
  aidPercentage: number
  alpinePercentage: number
  mixedPercentage: number
  icePercentage: number
  topRopePercentage: number
  primaryStyle: ClimbingStyleType
  isMultiStyle: boolean
  styleCount: number
}

/**
 * Priority order for styles when there's a tie
 */
const STYLE_PRIORITY: ClimbingStyleType[] = [
  'sport',
  'trad',
  'boulder',
  'alpine',
  'aid',
  'mixed',
  'ice',
  'topRope',
]

/**
 * Threshold for considering a style significant (10%)
 */
const SIGNIFICANT_STYLE_THRESHOLD = 10

/**
 * Threshold for considering a sector predominantly one style (80%)
 */
const PREDOMINANT_STYLE_THRESHOLD = 80

/**
 * Value object representing climbing style distribution for a sector or area.
 * Tracks counts and percentages for each climbing style to enable filtering.
 */
export class StyleDistribution {
  private readonly sport: number
  private readonly trad: number
  private readonly boulder: number
  private readonly aid: number
  private readonly alpine: number
  private readonly mixed: number
  private readonly ice: number
  private readonly topRope: number

  private constructor(
    sport: number,
    trad: number,
    boulder: number,
    aid: number,
    alpine: number,
    mixed: number,
    ice: number,
    topRope: number,
  ) {
    this.sport = sport
    this.trad = trad
    this.boulder = boulder
    this.aid = aid
    this.alpine = alpine
    this.mixed = mixed
    this.ice = ice
    this.topRope = topRope
  }

  /**
   * Creates style distribution from style counts
   */
  static createFrom(
    counts: StyleCountsInput | null | undefined,
  ): StyleDistribution {
    if (!counts) {
      return StyleDistribution.createEmpty()
    }

    return new StyleDistribution(
      counts.sport ?? 0,
      counts.trad ?? 0,
      counts.boulder ?? 0,
      counts.aid ?? 0,
      counts.alpine ?? 0,
      counts.mixed ?? 0,
      counts.ice ?? 0,
      counts.topRope ?? 0,
    )
  }

  /**
   * Creates empty style distribution
   */
  static createEmpty(): StyleDistribution {
    return new StyleDistribution(0, 0, 0, 0, 0, 0, 0, 0)
  }

  // ============================================================================
  // TOTAL COUNTS
  // ============================================================================

  /**
   * Get total number of routes across all styles
   */
  getTotalRoutes(): number {
    return (
      this.sport +
      this.trad +
      this.boulder +
      this.aid +
      this.alpine +
      this.mixed +
      this.ice +
      this.topRope
    )
  }

  /**
   * Check if distribution is empty
   */
  isEmpty(): boolean {
    return this.getTotalRoutes() === 0
  }

  // ============================================================================
  // INDIVIDUAL STYLE COUNTS
  // ============================================================================

  getSportCount(): number {
    return this.sport
  }
  getTradCount(): number {
    return this.trad
  }
  getBoulderCount(): number {
    return this.boulder
  }
  getAidCount(): number {
    return this.aid
  }
  getAlpineCount(): number {
    return this.alpine
  }
  getMixedCount(): number {
    return this.mixed
  }
  getIceCount(): number {
    return this.ice
  }
  getTopRopeCount(): number {
    return this.topRope
  }

  // ============================================================================
  // PERCENTAGES
  // ============================================================================

  private calculatePercentage(count: number): number {
    const total = this.getTotalRoutes()
    if (total === 0) return 0
    return Math.round((count / total) * 100)
  }

  getSportPercentage(): number {
    return this.calculatePercentage(this.sport)
  }
  getTradPercentage(): number {
    return this.calculatePercentage(this.trad)
  }
  getBoulderPercentage(): number {
    return this.calculatePercentage(this.boulder)
  }
  getAidPercentage(): number {
    return this.calculatePercentage(this.aid)
  }
  getAlpinePercentage(): number {
    return this.calculatePercentage(this.alpine)
  }
  getMixedPercentage(): number {
    return this.calculatePercentage(this.mixed)
  }
  getIcePercentage(): number {
    return this.calculatePercentage(this.ice)
  }
  getTopRopePercentage(): number {
    return this.calculatePercentage(this.topRope)
  }

  // ============================================================================
  // ANALYSIS
  // ============================================================================

  /**
   * Get the primary/dominant climbing style
   */
  getPrimaryStyle(): ClimbingStyleType {
    if (this.isEmpty()) return 'unknown'

    const styles: Array<{ style: ClimbingStyleType; count: number }> = [
      { style: 'sport', count: this.sport },
      { style: 'trad', count: this.trad },
      { style: 'boulder', count: this.boulder },
      { style: 'aid', count: this.aid },
      { style: 'alpine', count: this.alpine },
      { style: 'mixed', count: this.mixed },
      { style: 'ice', count: this.ice },
      { style: 'topRope', count: this.topRope },
    ]

    // Sort by count descending, then by priority for ties
    styles.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count
      return STYLE_PRIORITY.indexOf(a.style) - STYLE_PRIORITY.indexOf(b.style)
    })

    return styles[0].count > 0 ? styles[0].style : 'unknown'
  }

  /**
   * Get number of styles with routes
   */
  getStyleCount(): number {
    let count = 0
    if (this.sport > 0) count++
    if (this.trad > 0) count++
    if (this.boulder > 0) count++
    if (this.aid > 0) count++
    if (this.alpine > 0) count++
    if (this.mixed > 0) count++
    if (this.ice > 0) count++
    if (this.topRope > 0) count++
    return count
  }

  /**
   * Check if sector has multiple significant styles (>10% each)
   */
  isMultiStyle(): boolean {
    let significantCount = 0
    if (this.getSportPercentage() >= SIGNIFICANT_STYLE_THRESHOLD)
      significantCount++
    if (this.getTradPercentage() >= SIGNIFICANT_STYLE_THRESHOLD)
      significantCount++
    if (this.getBoulderPercentage() >= SIGNIFICANT_STYLE_THRESHOLD)
      significantCount++
    if (this.getAidPercentage() >= SIGNIFICANT_STYLE_THRESHOLD)
      significantCount++
    if (this.getAlpinePercentage() >= SIGNIFICANT_STYLE_THRESHOLD)
      significantCount++
    if (this.getMixedPercentage() >= SIGNIFICANT_STYLE_THRESHOLD)
      significantCount++
    if (this.getIcePercentage() >= SIGNIFICANT_STYLE_THRESHOLD)
      significantCount++
    if (this.getTopRopePercentage() >= SIGNIFICANT_STYLE_THRESHOLD)
      significantCount++

    return significantCount >= 2
  }

  /**
   * Check if sector is predominantly one style (>80% one style)
   */
  isPredominantlySingleStyle(): boolean {
    return (
      this.getSportPercentage() >= PREDOMINANT_STYLE_THRESHOLD ||
      this.getTradPercentage() >= PREDOMINANT_STYLE_THRESHOLD ||
      this.getBoulderPercentage() >= PREDOMINANT_STYLE_THRESHOLD ||
      this.getAidPercentage() >= PREDOMINANT_STYLE_THRESHOLD ||
      this.getAlpinePercentage() >= PREDOMINANT_STYLE_THRESHOLD ||
      this.getMixedPercentage() >= PREDOMINANT_STYLE_THRESHOLD ||
      this.getIcePercentage() >= PREDOMINANT_STYLE_THRESHOLD ||
      this.getTopRopePercentage() >= PREDOMINANT_STYLE_THRESHOLD
    )
  }

  /**
   * Get all styles with counts, sorted by count descending
   */
  getAllStyles(): StyleEntry[] {
    const styles: StyleEntry[] = [
      {
        style: 'sport',
        count: this.sport,
        percentage: this.getSportPercentage(),
      },
      { style: 'trad', count: this.trad, percentage: this.getTradPercentage() },
      {
        style: 'boulder',
        count: this.boulder,
        percentage: this.getBoulderPercentage(),
      },
      { style: 'aid', count: this.aid, percentage: this.getAidPercentage() },
      {
        style: 'alpine',
        count: this.alpine,
        percentage: this.getAlpinePercentage(),
      },
      {
        style: 'mixed',
        count: this.mixed,
        percentage: this.getMixedPercentage(),
      },
      { style: 'ice', count: this.ice, percentage: this.getIcePercentage() },
      {
        style: 'topRope',
        count: this.topRope,
        percentage: this.getTopRopePercentage(),
      },
    ]

    // Filter out zero-count styles and sort by count descending
    return styles.filter((s) => s.count > 0).sort((a, b) => b.count - a.count)
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  toPrimitives(): StyleDistributionPrimitives {
    return {
      totalRoutes: this.getTotalRoutes(),
      sportCount: this.sport,
      tradCount: this.trad,
      boulderCount: this.boulder,
      aidCount: this.aid,
      alpineCount: this.alpine,
      mixedCount: this.mixed,
      iceCount: this.ice,
      topRopeCount: this.topRope,
      sportPercentage: this.getSportPercentage(),
      tradPercentage: this.getTradPercentage(),
      boulderPercentage: this.getBoulderPercentage(),
      aidPercentage: this.getAidPercentage(),
      alpinePercentage: this.getAlpinePercentage(),
      mixedPercentage: this.getMixedPercentage(),
      icePercentage: this.getIcePercentage(),
      topRopePercentage: this.getTopRopePercentage(),
      primaryStyle: this.getPrimaryStyle(),
      isMultiStyle: this.isMultiStyle(),
      styleCount: this.getStyleCount(),
    }
  }

  // ============================================================================
  // EQUALITY
  // ============================================================================

  equals(other: StyleDistribution): boolean {
    return (
      this.sport === other.sport &&
      this.trad === other.trad &&
      this.boulder === other.boulder &&
      this.aid === other.aid &&
      this.alpine === other.alpine &&
      this.mixed === other.mixed &&
      this.ice === other.ice &&
      this.topRope === other.topRope
    )
  }

  toString(): string {
    return `StyleDistribution(primary=${this.getPrimaryStyle()}, total=${this.getTotalRoutes()})`
  }
}
