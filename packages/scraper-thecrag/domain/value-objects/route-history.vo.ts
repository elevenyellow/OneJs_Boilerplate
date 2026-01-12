/**
 * Represents a single history entry (FA, FFA, Set, etc.)
 */
export interface HistoryEntry {
  type: string
  climber: string
  date: string | null
}

/**
 * Value Object representing the complete history of a route.
 * Contains information about first ascent (FA), first free ascent (FFA),
 * and setter/equipper (Set) - the person who bolted/equipped the route.
 */
export class RouteHistory {
  private constructor(
    private readonly firstAscent: HistoryEntry | null,
    private readonly firstFreeAscent: HistoryEntry | null,
    private readonly setter: HistoryEntry | null,
    private readonly allEntries: HistoryEntry[],
  ) {}

  /**
   * Creates RouteHistory from an array of history entries.
   */
  static fromHistoryArray(
    history: Array<{ type?: string; climber?: string; date?: string }>,
  ): RouteHistory {
    if (!history || !Array.isArray(history) || history.length === 0) {
      return RouteHistory.empty()
    }

    const entries: HistoryEntry[] = history.map((h) => ({
      type: h.type ?? 'Unknown',
      climber: h.climber ?? 'Unknown',
      date: h.date ?? null,
    }))

    const fa = entries.find((e) => e.type.toUpperCase() === 'FA') ?? null
    const ffa = entries.find((e) => e.type.toUpperCase() === 'FFA') ?? null
    const setter =
      entries.find((e) => e.type.toLowerCase() === 'set') ??
      entries.find((e) => e.type.toLowerCase() === 'equipped') ??
      entries.find((e) => e.type.toLowerCase() === 'bolted') ??
      null

    return new RouteHistory(fa, ffa, setter, entries)
  }

  /**
   * Creates RouteHistory with FA information (legacy compatibility).
   */
  static create(
    faType: string,
    climber: string,
    date: string | null,
  ): RouteHistory {
    const entry: HistoryEntry = { type: faType, climber, date }

    if (faType.toUpperCase() === 'FA') {
      return new RouteHistory(entry, null, null, [entry])
    }
    if (faType.toUpperCase() === 'FFA') {
      return new RouteHistory(null, entry, null, [entry])
    }
    if (faType.toLowerCase() === 'set') {
      return new RouteHistory(null, null, entry, [entry])
    }

    return new RouteHistory(null, null, null, [entry])
  }

  /**
   * Creates an empty RouteHistory.
   */
  static empty(): RouteHistory {
    return new RouteHistory(null, null, null, [])
  }

  /**
   * Creates RouteHistory from TheCrag API response.
   * Extracts history array from the data property.
   */
  static fromApiResponse(
    apiResponse: Record<string, unknown> | null,
  ): RouteHistory | null {
    if (!apiResponse) return null
    const data = apiResponse.data as Record<string, unknown> | undefined
    if (!data) return null
    const history = data.history as
      | Array<{ type?: string; climber?: string; date?: string }>
      | undefined
    if (!history || !Array.isArray(history) || history.length === 0) return null
    return RouteHistory.fromHistoryArray(history)
  }

  // === First Ascent ===

  /**
   * Returns the first ascent entry, if available.
   */
  getFirstAscent(): HistoryEntry | null {
    return this.firstAscent
  }

  /**
   * Returns the first ascent climber name.
   */
  getFirstAscentClimber(): string | null {
    return this.firstAscent?.climber ?? null
  }

  /**
   * Returns the first ascent date.
   */
  getFirstAscentDate(): string | null {
    return this.firstAscent?.date ?? null
  }

  /**
   * Returns the first ascent year.
   */
  getFirstAscentYear(): number | null {
    return this.extractYear(this.firstAscent?.date)
  }

  /**
   * Returns true if this route has a first ascent record.
   */
  hasFirstAscent(): boolean {
    return this.firstAscent !== null
  }

  // === First Free Ascent ===

  /**
   * Returns the first free ascent entry, if available.
   */
  getFirstFreeAscent(): HistoryEntry | null {
    return this.firstFreeAscent
  }

  /**
   * Returns the first free ascent climber name.
   */
  getFirstFreeAscentClimber(): string | null {
    return this.firstFreeAscent?.climber ?? null
  }

  /**
   * Returns the first free ascent date.
   */
  getFirstFreeAscentDate(): string | null {
    return this.firstFreeAscent?.date ?? null
  }

  /**
   * Returns the first free ascent year.
   */
  getFirstFreeAscentYear(): number | null {
    return this.extractYear(this.firstFreeAscent?.date)
  }

  /**
   * Returns true if this route has a first free ascent record.
   */
  hasFirstFreeAscent(): boolean {
    return this.firstFreeAscent !== null
  }

  // === Setter/Equipper ===

  /**
   * Returns the setter/equipper entry, if available.
   * The setter is the person who bolted/equipped the route.
   */
  getSetter(): HistoryEntry | null {
    return this.setter
  }

  /**
   * Returns the setter/equipper name.
   */
  getSetterName(): string | null {
    return this.setter?.climber ?? null
  }

  /**
   * Returns the date when the route was equipped.
   */
  getSetterDate(): string | null {
    return this.setter?.date ?? null
  }

  /**
   * Returns the year when the route was equipped.
   */
  getSetterYear(): number | null {
    return this.extractYear(this.setter?.date)
  }

  /**
   * Returns true if this route has a setter/equipper record.
   */
  hasSetter(): boolean {
    return this.setter !== null
  }

  // === All Entries ===

  /**
   * Returns all history entries.
   */
  getAllEntries(): HistoryEntry[] {
    return [...this.allEntries]
  }

  /**
   * Returns true if the route has any history records.
   */
  hasHistory(): boolean {
    return this.allEntries.length > 0
  }

  // === Legacy Compatibility ===

  /**
   * Returns the FA type (legacy method, returns first available type).
   * @deprecated Use getFirstAscent(), getFirstFreeAscent(), or getSetter() instead.
   */
  getFaType(): string {
    return (
      this.firstAscent?.type ??
      this.firstFreeAscent?.type ??
      this.setter?.type ??
      'Unknown'
    )
  }

  /**
   * Returns the climber name (legacy method, returns first available).
   * @deprecated Use getFirstAscentClimber(), getFirstFreeAscentClimber(), or getSetterName() instead.
   */
  getClimber(): string {
    return (
      this.firstAscent?.climber ??
      this.firstFreeAscent?.climber ??
      this.setter?.climber ??
      'Unknown'
    )
  }

  /**
   * Returns the date (legacy method, returns first available).
   * @deprecated Use getFirstAscentDate(), getFirstFreeAscentDate(), or getSetterDate() instead.
   */
  getDate(): string | null {
    return (
      this.firstAscent?.date ??
      this.firstFreeAscent?.date ??
      this.setter?.date ??
      null
    )
  }

  /**
   * Returns true if this was a First Ascent (FA).
   */
  isFirstAscent(): boolean {
    return this.firstAscent !== null
  }

  /**
   * Returns true if this was a First Free Ascent (FFA).
   */
  isFirstFreeAscent(): boolean {
    return this.firstFreeAscent !== null
  }

  /**
   * Returns true if the route was set (equipped).
   */
  isSet(): boolean {
    return this.setter !== null
  }

  /**
   * Returns the year of the first available date.
   * @deprecated Use getFirstAscentYear(), getFirstFreeAscentYear(), or getSetterYear() instead.
   */
  getYear(): number | null {
    return (
      this.getFirstAscentYear() ??
      this.getFirstFreeAscentYear() ??
      this.getSetterYear()
    )
  }

  // === Helpers ===

  private extractYear(date: string | null | undefined): number | null {
    if (!date) return null

    const match = date.match(/(\d{4})/)
    if (match) {
      return Number.parseInt(match[1], 10)
    }
    return null
  }

  /**
   * Returns the date as a Date object, or null if not available.
   */
  getDateAsDate(): Date | null {
    const date = this.getDate()
    if (!date) return null
    const parsed = new Date(date)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  equals(other: RouteHistory): boolean {
    return (
      this.firstAscent?.climber === other.firstAscent?.climber &&
      this.firstAscent?.date === other.firstAscent?.date &&
      this.firstFreeAscent?.climber === other.firstFreeAscent?.climber &&
      this.setter?.climber === other.setter?.climber
    )
  }

  toString(): string {
    const parts: string[] = []

    if (this.firstAscent) {
      const date = this.firstAscent.date ? ` (${this.firstAscent.date})` : ''
      parts.push(`FA: ${this.firstAscent.climber}${date}`)
    }

    if (this.firstFreeAscent) {
      const date = this.firstFreeAscent.date
        ? ` (${this.firstFreeAscent.date})`
        : ''
      parts.push(`FFA: ${this.firstFreeAscent.climber}${date}`)
    }

    if (this.setter) {
      const date = this.setter.date ? ` (${this.setter.date})` : ''
      parts.push(`Set: ${this.setter.climber}${date}`)
    }

    return parts.join(', ') || 'No history'
  }

  toDto(): {
    firstAscent: HistoryEntry | null
    firstFreeAscent: HistoryEntry | null
    setter: HistoryEntry | null
    allEntries: HistoryEntry[]
  } {
    return {
      firstAscent: this.firstAscent,
      firstFreeAscent: this.firstFreeAscent,
      setter: this.setter,
      allEntries: this.allEntries,
    }
  }
}
