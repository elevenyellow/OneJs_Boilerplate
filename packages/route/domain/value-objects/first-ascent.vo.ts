/**
 * FirstAscent Value Object
 * Represents the first ascent information of a route
 */
export class FirstAscent {
  private constructor(private readonly value: string) {}

  static create(fa: string | null | undefined): FirstAscent | null {
    if (!fa || typeof fa !== 'string') {
      return null
    }

    const trimmed = fa.trim()

    if (trimmed.length === 0) {
      return null
    }

    if (trimmed.length > 500) {
      throw new Error('First ascent info is too long (max 500 characters)')
    }

    return new FirstAscent(trimmed)
  }

  toString(): string {
    return this.value
  }

  /**
   * Try to extract the year from the first ascent info
   */
  getYear(): number | null {
    const match = this.value.match(/\b(19|20)\d{2}\b/)
    return match ? parseInt(match[0], 10) : null
  }

  /**
   * Try to extract climber names
   */
  getClimbers(): string {
    // Remove year and common prefixes
    return this.value
      .replace(/\b(19|20)\d{2}\b/g, '')
      .replace(/^(FA|First Ascent|by|:)/i, '')
      .trim()
  }

  equals(other: FirstAscent): boolean {
    return this.value === other.value
  }
}
