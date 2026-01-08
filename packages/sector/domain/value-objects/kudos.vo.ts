/**
 * Kudos Value Object
 * Represents the kudos/popularity score of a sector
 */
export class Kudos {
  private constructor(private readonly value: number) {}

  static create(kudos: number | null | undefined): Kudos | null {
    if (kudos === null || kudos === undefined) {
      return null
    }

    const parsed = typeof kudos === 'number' ? kudos : parseFloat(String(kudos))

    if (isNaN(parsed) || parsed < 0) {
      return null
    }

    return new Kudos(parsed)
  }

  toNumber(): number {
    return this.value
  }

  /**
   * Check if this sector is highly rated
   */
  isPopular(): boolean {
    return this.value >= 50
  }

  equals(other: Kudos): boolean {
    return this.value === other.value
  }
}
