/**
 * Ascents Value Object
 * Represents the number of recorded ascents of a route
 */
export class Ascents {
  private constructor(private readonly value: number) {}

  static create(ascents: number | null | undefined): Ascents | null {
    if (ascents === null || ascents === undefined) {
      return null
    }

    const parsed =
      typeof ascents === 'number' ? ascents : parseInt(String(ascents), 10)

    if (isNaN(parsed) || parsed < 0) {
      return null
    }

    return new Ascents(parsed)
  }

  toNumber(): number {
    return this.value
  }

  /**
   * Check if this is a popular route (many ascents)
   */
  isPopular(): boolean {
    return this.value >= 100
  }

  /**
   * Check if this route has been climbed
   */
  hasBeenClimbed(): boolean {
    return this.value > 0
  }

  toString(): string {
    return `${this.value} ascent${this.value !== 1 ? 's' : ''}`
  }

  equals(other: Ascents): boolean {
    return this.value === other.value
  }
}
