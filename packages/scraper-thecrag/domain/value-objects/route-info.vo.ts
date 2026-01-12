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
 * Value Object representing route information extracted from data-route-tick.
 * Contains details about bolts, height, grade, style, and star ratings.
 */
export class RouteInfo {
  private constructor(
    private readonly bolts: number | null,
    private readonly displayHeight: string | null,
    private readonly gradeContext: string | null,
    private readonly stars: number | null,
    private readonly styleStub: string | null,
    private readonly gradeSystems: Record<string, string>,
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
    )
  }

  /**
   * Creates an empty RouteInfo.
   */
  static empty(): RouteInfo {
    return new RouteInfo(null, null, null, null, null, {})
  }

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

  /**
   * Returns true if this is a sport climbing route.
   */
  isSport(): boolean {
    return this.styleStub?.toLowerCase() === 'sport'
  }

  /**
   * Returns true if this is a traditional climbing route.
   */
  isTrad(): boolean {
    return this.styleStub?.toLowerCase() === 'trad'
  }

  /**
   * Returns true if this is a bouldering problem.
   */
  isBoulder(): boolean {
    return this.styleStub?.toLowerCase() === 'boulder'
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
}
