/**
 * Value Object representing route ascent count.
 * Simplified to single field - frontend handles display formatting.
 */
export class Ascents {
  private readonly value: number | null

  private constructor(ascents: number | null) {
    this.value = ascents
  }

  /**
   * Create from database value or scraped data.
   * Consolidates ascentCount and ascents into single value (prefers ascentCount).
   */
  static createFrom(
    ascents: number | null | undefined,
    ascentCount?: number | null | undefined,
  ): Ascents {
    // Prefer ascentCount if available, fallback to ascents
    const value = ascentCount ?? ascents ?? null
    return new Ascents(value)
  }

  static createEmpty(): Ascents {
    return new Ascents(null)
  }

  getValue(): number | null {
    return this.value
  }

  /**
   * Get total ascents, defaulting to 0 if null
   */
  getTotalAscents(): number {
    return this.value ?? 0
  }

  hasValue(): boolean {
    return this.value !== null
  }

  isPopular(): boolean {
    return this.getTotalAscents() >= 50
  }

  isVeryPopular(): boolean {
    return this.getTotalAscents() >= 100
  }

  equals(other: Ascents): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.getTotalAscents().toString()
  }
}
