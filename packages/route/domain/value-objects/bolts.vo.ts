/**
 * Bolts Value Object
 * Represents the number of bolts/protection points on a sport route
 */
export class Bolts {
  private constructor(private readonly value: number) {}

  static create(bolts: number | null | undefined): Bolts | null {
    if (bolts === null || bolts === undefined) {
      return null
    }

    const parsed =
      typeof bolts === 'number' ? bolts : parseInt(String(bolts), 10)

    if (isNaN(parsed)) {
      return null
    }

    if (parsed < 0) {
      return null
    }

    if (parsed > 200) {
      throw new Error('Bolt count seems unrealistic (max 200)')
    }

    return new Bolts(parsed)
  }

  toNumber(): number {
    return this.value
  }

  /**
   * Check if this is likely a sport route (has bolts)
   */
  isSport(): boolean {
    return this.value > 0
  }

  /**
   * Check if this is well-protected (many bolts relative to typical routes)
   */
  isWellProtected(): boolean {
    return this.value >= 8
  }

  toString(): string {
    return `${this.value} bolt${this.value !== 1 ? 's' : ''}`
  }

  equals(other: Bolts): boolean {
    return this.value === other.value
  }
}
