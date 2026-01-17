import type { ProtectionRating } from '../dtos/route-response.dto'

/**
 * Thresholds for bolt spacing (meters per bolt)
 * Based on common climbing safety standards
 */
const PROTECTION_THRESHOLDS = {
  WELL_PROTECTED_MAX: 2.5,
  NORMAL_MAX: 3.5,
  SPACED_MAX: 5.0,
} as const

export class Bolts {
  private readonly value: number | null

  private constructor(value: number | null) {
    this.value = value
  }

  static createFrom(bolts: number | null | undefined): Bolts {
    return new Bolts(bolts ?? null)
  }

  static createEmpty(): Bolts {
    return new Bolts(null)
  }

  getValue(): number | null {
    return this.value
  }

  hasValue(): boolean {
    return this.value !== null
  }

  hasBolts(): boolean {
    return this.value !== null && this.value > 0
  }

  /**
   * Calculate meters per bolt (bolt spacing)
   * Returns null if we don't have enough data
   */
  getBoltSpacing(heightMeters: number | null): number | null {
    if (this.value === null || this.value === 0) return null
    if (heightMeters === null || heightMeters <= 0) return null

    return heightMeters / this.value
  }

  /**
   * Check if route is well protected based on bolt spacing
   * Well protected = <= 2.5m between bolts
   */
  isWellProtected(heightMeters: number | null): boolean {
    const spacing = this.getBoltSpacing(heightMeters)
    if (spacing === null) return false

    return spacing <= PROTECTION_THRESHOLDS.WELL_PROTECTED_MAX
  }

  /**
   * Check if route is runout based on bolt spacing
   * Runout = > 5m between bolts
   */
  isRunout(heightMeters: number | null): boolean {
    const spacing = this.getBoltSpacing(heightMeters)
    if (spacing === null) return false

    return spacing > PROTECTION_THRESHOLDS.SPACED_MAX
  }

  /**
   * Get protection rating based on bolt spacing
   * - well-protected: <= 2.5m between bolts
   * - normal: 2.5m - 3.5m between bolts
   * - spaced: 3.5m - 5m between bolts
   * - runout: > 5m between bolts
   * - unknown: missing data
   */
  getProtectionRating(heightMeters: number | null): ProtectionRating {
    const spacing = this.getBoltSpacing(heightMeters)
    if (spacing === null) return 'unknown'

    if (spacing <= PROTECTION_THRESHOLDS.WELL_PROTECTED_MAX)
      return 'well-protected'
    if (spacing <= PROTECTION_THRESHOLDS.NORMAL_MAX) return 'normal'
    if (spacing <= PROTECTION_THRESHOLDS.SPACED_MAX) return 'spaced'
    return 'runout'
  }

  equals(other: Bolts): boolean {
    return this.value === other.value
  }

  toString(): string {
    if (this.value === null) return ''
    return `${this.value} bolt${this.value !== 1 ? 's' : ''}`
  }
}
