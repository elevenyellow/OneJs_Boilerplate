/**
 * Raw data from data-route-tick attribute.
 */
interface RawRouteTickData {
  bolts?: number
  displayHeight?: string
  gradeContext?: string
  stars?: number
  styleStub?: string
  gradeSystems?: Record<string, string>
}

/**
 * Climbing style enum for route classification.
 */
export enum ClimbingStyle {
  SPORT = 'sport',
  TRAD = 'trad',
  BOULDER = 'boulder',
  MIXED = 'mixed',
  AID = 'aid',
  TOP_ROPE = 'top-rope',
  ALPINE = 'alpine',
  ICE = 'ice',
  DRY_TOOLING = 'dry-tooling',
  DEEP_WATER_SOLO = 'dws',
  UNKNOWN = 'unknown',
}

/**
 * Value Object representing route information extracted from data-route-tick
 * and additional API data. Contains details about bolts, height, grade, style,
 * star ratings, and protection requirements.
 */
export class RouteInfo {
  private constructor(
    private readonly bolts: number | null,
    private readonly displayHeight: string | null,
    private readonly gradeContext: string | null,
    private readonly stars: number | null,
    private readonly styleStub: string | null,
    private readonly gradeSystems: Record<string, string>,
    // Additional fields
    private readonly pitches: number | null,
    private readonly protection: string | null,
    private readonly rockType: string | null,
    private readonly routeType: string | null,
    private readonly ascentCount: number | null,
    private readonly length: number | null,
  ) {}

  /**
   * Creates RouteInfo from data-route-tick JSON data.
   */
  static fromRouteTickData(data: RawRouteTickData): RouteInfo {
    return new RouteInfo(
      data.bolts ?? null,
      data.displayHeight ?? null,
      data.gradeContext ?? null,
      data.stars ?? null,
      data.styleStub ?? null,
      data.gradeSystems ?? {},
      null,
      null,
      null,
      null,
      null,
      null,
    )
  }

  /**
   * Creates RouteInfo with all available data.
   */
  static create(data: {
    bolts?: number | null
    displayHeight?: string | null
    gradeContext?: string | null
    stars?: number | null
    styleStub?: string | null
    gradeSystems?: Record<string, string>
    pitches?: number | null
    protection?: string | null
    rockType?: string | null
    routeType?: string | null
    ascentCount?: number | null
    length?: number | null
  }): RouteInfo {
    return new RouteInfo(
      data.bolts ?? null,
      data.displayHeight ?? null,
      data.gradeContext ?? null,
      data.stars ?? null,
      data.styleStub ?? null,
      data.gradeSystems ?? {},
      data.pitches ?? null,
      data.protection ?? null,
      data.rockType ?? null,
      data.routeType ?? null,
      data.ascentCount ?? null,
      data.length ?? null,
    )
  }

  /**
   * Creates an empty RouteInfo.
   */
  static empty(): RouteInfo {
    return new RouteInfo(
      null,
      null,
      null,
      null,
      null,
      {},
      null,
      null,
      null,
      null,
      null,
      null,
    )
  }

  // === Basic Info ===

  getBolts(): number | null {
    return this.bolts
  }

  getDisplayHeight(): string | null {
    return this.displayHeight
  }

  getGradeContext(): string | null {
    return this.gradeContext
  }

  getStars(): number | null {
    return this.stars
  }

  getStyleStub(): string | null {
    return this.styleStub
  }

  // === Additional Info ===

  getPitches(): number | null {
    return this.pitches
  }

  getProtection(): string | null {
    return this.protection
  }

  getRockType(): string | null {
    return this.rockType
  }

  getRouteType(): string | null {
    return this.routeType
  }

  getAscentCount(): number | null {
    return this.ascentCount
  }

  getLength(): number | null {
    return this.length
  }

  /**
   * Returns the grade in a specific grading system.
   */
  getGradeInSystem(system: string): string | null {
    return this.gradeSystems[system] ?? null
  }

  /**
   * Returns all available grade systems.
   */
  getGradeSystems(): Record<string, string> {
    return { ...this.gradeSystems }
  }

  /**
   * Returns the height as a number in meters.
   * Returns null if height cannot be parsed.
   */
  getHeightInMeters(): number | null {
    if (!this.displayHeight) return null

    const match = this.displayHeight.match(/(\d+(?:\.\d+)?)\s*m?/)
    if (match) {
      return Number.parseFloat(match[1])
    }
    return null
  }

  // === Style Classification ===

  /**
   * Returns the normalized climbing style.
   */
  getClimbingStyle(): ClimbingStyle {
    if (!this.styleStub) return ClimbingStyle.UNKNOWN

    const style = this.styleStub.toLowerCase()

    if (style === 'sport' || style === 'sportclimbing')
      return ClimbingStyle.SPORT
    if (style === 'trad' || style === 'traditional') return ClimbingStyle.TRAD
    if (style === 'boulder' || style === 'bouldering')
      return ClimbingStyle.BOULDER
    if (style === 'mixed') return ClimbingStyle.MIXED
    if (style === 'aid' || style === 'aidclimbing') return ClimbingStyle.AID
    if (style === 'toprope' || style === 'top-rope' || style === 'tr')
      return ClimbingStyle.TOP_ROPE
    if (style === 'alpine') return ClimbingStyle.ALPINE
    if (style === 'ice') return ClimbingStyle.ICE
    if (style === 'drytooling' || style === 'dry-tooling')
      return ClimbingStyle.DRY_TOOLING
    if (style === 'dws' || style === 'deepwatersolo' || style === 'psicobloc')
      return ClimbingStyle.DEEP_WATER_SOLO

    return ClimbingStyle.UNKNOWN
  }

  /**
   * Returns true if this is a sport climbing route.
   */
  isSport(): boolean {
    return this.getClimbingStyle() === ClimbingStyle.SPORT
  }

  /**
   * Returns true if this is a traditional climbing route.
   */
  isTrad(): boolean {
    return this.getClimbingStyle() === ClimbingStyle.TRAD
  }

  /**
   * Returns true if this is a bouldering problem.
   */
  isBoulder(): boolean {
    return this.getClimbingStyle() === ClimbingStyle.BOULDER
  }

  /**
   * Returns true if this is a mixed route.
   */
  isMixed(): boolean {
    return this.getClimbingStyle() === ClimbingStyle.MIXED
  }

  /**
   * Returns true if this is an aid climbing route.
   */
  isAid(): boolean {
    return this.getClimbingStyle() === ClimbingStyle.AID
  }

  /**
   * Returns true if this requires lead climbing gear.
   */
  requiresLeadGear(): boolean {
    const style = this.getClimbingStyle()
    return style === ClimbingStyle.TRAD || style === ClimbingStyle.MIXED
  }

  /**
   * Returns true if this is a multi-pitch route.
   */
  isMultiPitch(): boolean {
    return this.pitches !== null && this.pitches > 1
  }

  /**
   * Returns true if this route has bolts.
   */
  hasBolts(): boolean {
    return this.bolts !== null && this.bolts > 0
  }

  /**
   * Returns true if this route has a star rating.
   */
  hasStars(): boolean {
    return this.stars !== null && this.stars > 0
  }

  /**
   * Returns the star rating as a string (e.g., "★★★").
   */
  getStarsString(): string {
    if (!this.stars) return ''
    return '★'.repeat(this.stars)
  }

  /**
   * Returns a human-readable style description.
   */
  getStyleDescription(): string {
    const style = this.getClimbingStyle()

    switch (style) {
      case ClimbingStyle.SPORT:
        return 'Sport'
      case ClimbingStyle.TRAD:
        return 'Traditional'
      case ClimbingStyle.BOULDER:
        return 'Boulder'
      case ClimbingStyle.MIXED:
        return 'Mixed'
      case ClimbingStyle.AID:
        return 'Aid'
      case ClimbingStyle.TOP_ROPE:
        return 'Top Rope'
      case ClimbingStyle.ALPINE:
        return 'Alpine'
      case ClimbingStyle.ICE:
        return 'Ice'
      case ClimbingStyle.DRY_TOOLING:
        return 'Dry Tooling'
      case ClimbingStyle.DEEP_WATER_SOLO:
        return 'Deep Water Solo'
      default:
        return this.styleStub ?? 'Unknown'
    }
  }

  /**
   * Returns a summary of the route info.
   */
  getSummary(): string {
    const parts: string[] = []

    parts.push(this.getStyleDescription())

    if (this.displayHeight) {
      parts.push(this.displayHeight)
    }

    if (this.bolts && this.bolts > 0) {
      parts.push(`${this.bolts} bolts`)
    }

    if (this.pitches && this.pitches > 1) {
      parts.push(`${this.pitches} pitches`)
    }

    if (this.stars && this.stars > 0) {
      parts.push(this.getStarsString())
    }

    return parts.join(' • ')
  }

  equals(other: RouteInfo): boolean {
    return (
      this.bolts === other.bolts &&
      this.displayHeight === other.displayHeight &&
      this.gradeContext === other.gradeContext &&
      this.stars === other.stars &&
      this.styleStub === other.styleStub
    )
  }

  toString(): string {
    const parts: string[] = []
    if (this.styleStub) parts.push(this.styleStub)
    if (this.displayHeight) parts.push(this.displayHeight)
    if (this.bolts) parts.push(`${this.bolts} bolts`)
    if (this.stars) parts.push(`${this.stars} stars`)
    return `RouteInfo(${parts.join(', ')})`
  }

  toDto(): {
    bolts: number | null
    height: string | null
    heightInMeters: number | null
    stars: number | null
    starsString: string
    style: string | null
    climbingStyle: ClimbingStyle
    styleDescription: string
    pitches: number | null
    protection: string | null
    rockType: string | null
    routeType: string | null
    ascentCount: number | null
    gradeSystems: Record<string, string>
    summary: string
  } {
    return {
      bolts: this.bolts,
      height: this.displayHeight,
      heightInMeters: this.getHeightInMeters(),
      stars: this.stars,
      starsString: this.getStarsString(),
      style: this.styleStub,
      climbingStyle: this.getClimbingStyle(),
      styleDescription: this.getStyleDescription(),
      pitches: this.pitches,
      protection: this.protection,
      rockType: this.rockType,
      routeType: this.routeType,
      ascentCount: this.ascentCount,
      gradeSystems: this.gradeSystems,
      summary: this.getSummary(),
    }
  }
}
