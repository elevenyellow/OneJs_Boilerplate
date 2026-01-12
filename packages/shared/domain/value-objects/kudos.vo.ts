/**
 * Kudos Value Object
 * Represents the kudos/popularity score of a crag or sector
 */
export class Kudos {
  private constructor(private readonly value: number) {}

  static create(kudos: unknown): Kudos | null {
    if (kudos === null || kudos === undefined) {
      return null
    }

    const parsed =
      typeof kudos === 'number' ? kudos : parseFloat(String(kudos))

    if (isNaN(parsed) || parsed < 0) {
      return null
    }

    return new Kudos(Math.round(parsed))
  }

  toNumber(): number {
    return this.value
  }

  toJSON(): number {
    return this.value
  }

  toString(): string {
    return this.value.toString()
  }

  equals(other: Kudos): boolean {
    return this.value === other.value
  }

  /**
   * Check if highly rated (>= 100 kudos)
   */
  isHighlyRated(): boolean {
    return this.value >= 100
  }

  /**
   * Check if popular (>= 50 kudos)
   */
  isPopular(): boolean {
    return this.value >= 50
  }

  /**
   * Check if has any rating
   */
  hasRating(): boolean {
    return this.value > 0
  }
}
