/**
 * Value Object: PriceCategory
 * Represents the price category for a crag
 */

const VALID_CATEGORIES = ['Free', 'Cheap', 'Moderate', 'Expensive', 'Unknown'] as const

export type PriceCategoryType = typeof VALID_CATEGORIES[number]

export class PriceCategory {
  private constructor(private readonly value: string) {}

  static create(priceCategory: unknown): PriceCategory | null {
    if (!priceCategory) return null
    
    const normalized = this.normalize(String(priceCategory))
    if (!normalized) return null
    
    return new PriceCategory(normalized)
  }

  private static normalize(value: string): string | null {
    const cleaned = value.trim()
    
    // Check if it's already a valid category
    if (VALID_CATEGORIES.includes(cleaned as PriceCategoryType)) {
      return cleaned
    }
    
    // Normalize common variations
    const lower = cleaned.toLowerCase()
    
    if (lower.includes('free') || lower.includes('gratis') || lower === '0') {
      return 'Free'
    }
    
    if (lower.includes('cheap') || lower.includes('barato') || lower === '1') {
      return 'Cheap'
    }
    
    if (lower.includes('moderate') || lower.includes('moderado') || lower === '2') {
      return 'Moderate'
    }
    
    if (lower.includes('expensive') || lower.includes('caro') || lower === '3') {
      return 'Expensive'
    }
    
    return 'Unknown'
  }

  toString(): string {
    return this.value
  }

  toJSON(): string {
    return this.value
  }

  equals(other: PriceCategory): boolean {
    return this.value === other.value
  }

  isFree(): boolean {
    return this.value === 'Free'
  }

  isExpensive(): boolean {
    return this.value === 'Expensive'
  }

  requiresPayment(): boolean {
    return this.value !== 'Free' && this.value !== 'Unknown'
  }
}
