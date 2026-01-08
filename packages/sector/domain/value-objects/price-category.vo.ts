/**
 * PriceCategory Value Object
 * Represents the access price category for a sector
 */
export class PriceCategory {
  private constructor(private readonly value: string) {}

  static create(category: string | null | undefined): PriceCategory | null {
    if (!category || typeof category !== 'string') {
      return null
    }

    const trimmed = category.trim()

    if (trimmed.length === 0) {
      return null
    }

    if (trimmed.length > 100) {
      throw new Error('Price category is too long (max 100 characters)')
    }

    return new PriceCategory(trimmed)
  }

  toString(): string {
    return this.value
  }

  /**
   * Check if access is free
   */
  isFree(): boolean {
    const lower = this.value.toLowerCase()
    return lower === 'free' || lower === 'gratis' || lower === 'libre'
  }

  equals(other: PriceCategory): boolean {
    return this.value === other.value
  }
}
