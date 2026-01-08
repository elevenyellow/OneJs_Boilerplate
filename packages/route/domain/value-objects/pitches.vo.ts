/**
 * Pitches Value Object
 * Represents the number of pitches in a climbing route
 */
export class Pitches {
  private constructor(private readonly value: number) {}

  static create(pitches: number | null | undefined): Pitches | null {
    if (pitches === null || pitches === undefined) {
      return null
    }

    const parsed =
      typeof pitches === 'number' ? pitches : parseInt(String(pitches), 10)

    if (isNaN(parsed)) {
      return null
    }

    if (parsed < 1) {
      return null // Single pitch routes often have no pitch count
    }

    if (parsed > 100) {
      throw new Error('Pitch count seems unrealistic (max 100)')
    }

    return new Pitches(parsed)
  }

  toNumber(): number {
    return this.value
  }

  /**
   * Check if this is a multi-pitch route
   */
  isMultiPitch(): boolean {
    return this.value > 1
  }

  /**
   * Check if this is a big wall (typically 10+ pitches)
   */
  isBigWall(): boolean {
    return this.value >= 10
  }

  toString(): string {
    return `${this.value} pitch${this.value > 1 ? 'es' : ''}`
  }

  equals(other: Pitches): boolean {
    return this.value === other.value
  }
}
