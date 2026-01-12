/**
 * Value Object representing the first ascent history of a route.
 * Contains information about who did the first ascent and when.
 */
export class RouteHistory {
  private constructor(
    private readonly faType: string,
    private readonly climber: string,
    private readonly date: string | null,
  ) {}

  /**
   * Creates RouteHistory with FA information.
   */
  static create(
    faType: string,
    climber: string,
    date: string | null,
  ): RouteHistory {
    return new RouteHistory(faType, climber, date)
  }

  /**
   * Creates an empty RouteHistory.
   */
  static empty(): RouteHistory {
    return new RouteHistory('Unknown', 'Unknown', null)
  }

  /**
   * Returns the FA type (e.g., "Set", "FA", "FFA").
   * - "Set" means the route was equipped/set
   * - "FA" means First Ascent
   * - "FFA" means First Free Ascent
   */
  getFaType(): string {
    return this.faType
  }

  /**
   * Returns the name of the climber who made the ascent.
   */
  getClimber(): string {
    return this.climber
  }

  /**
   * Returns the date of the ascent.
   */
  getDate(): string | null {
    return this.date
  }

  /**
   * Returns true if this was a First Ascent (FA).
   */
  isFirstAscent(): boolean {
    return this.faType.toUpperCase() === 'FA'
  }

  /**
   * Returns true if this was a First Free Ascent (FFA).
   */
  isFirstFreeAscent(): boolean {
    return this.faType.toUpperCase() === 'FFA'
  }

  /**
   * Returns true if the route was set (equipped).
   */
  isSet(): boolean {
    return this.faType.toLowerCase() === 'set'
  }

  /**
   * Returns the year of the ascent, or null if date is not available.
   */
  getYear(): number | null {
    if (!this.date) return null

    const match = this.date.match(/(\d{4})/)
    if (match) {
      return Number.parseInt(match[1], 10)
    }
    return null
  }

  /**
   * Returns the date as a Date object, or null if not available.
   */
  getDateAsDate(): Date | null {
    if (!this.date) return null
    const parsed = new Date(this.date)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  equals(other: RouteHistory): boolean {
    return (
      this.faType === other.faType &&
      this.climber === other.climber &&
      this.date === other.date
    )
  }

  toString(): string {
    const dateStr = this.date ? ` (${this.date})` : ''
    return `${this.faType}: ${this.climber}${dateStr}`
  }
}
