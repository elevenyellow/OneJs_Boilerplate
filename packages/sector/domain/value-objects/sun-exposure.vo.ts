/**
 * SunExposure Value Object
 * Represents when a sector gets sun exposure
 */
export class SunExposure {
  private static readonly VALID_VALUES = [
    'Shaded',
    'Sun',
    'Morning',
    'Afternoon',
    'Mixed',
  ] as const

  private constructor(private readonly value: string) {}

  static create(sunExposure: unknown): SunExposure | null {
    if (!sunExposure) return null

    const normalized = String(sunExposure).trim()
    const capitalizedFirst =
      normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase()

    // Try exact match
    if (this.VALID_VALUES.includes(capitalizedFirst as any)) {
      return new SunExposure(capitalizedFirst)
    }

    // Try to map common variations
    const mapping: Record<string, string> = {
      shade: 'Shaded',
      shadow: 'Shaded',
      sombra: 'Shaded',
      ombre: 'Shaded',
      sunny: 'Sun',
      sol: 'Sun',
      soleil: 'Sun',
      'morning sun': 'Morning',
      'sol de mañana': 'Morning',
      matin: 'Morning',
      'afternoon sun': 'Afternoon',
      'sol de tarde': 'Afternoon',
      'après-midi': 'Afternoon',
      variable: 'Mixed',
      mixed: 'Mixed',
      mixto: 'Mixed',
      partial: 'Mixed',
      parcial: 'Mixed',
    }

    const lowerNormalized = normalized.toLowerCase()
    const mapped = mapping[lowerNormalized]
    if (mapped) {
      return new SunExposure(mapped)
    }

    // If we can't parse it, return null
    return null
  }

  toString(): string {
    return this.value
  }

  toJSON(): string {
    return this.value
  }

  equals(other: SunExposure): boolean {
    return this.value === other.value
  }

  /**
   * Returns true if this sector is good for hot days
   */
  isGoodForHotDays(): boolean {
    return ['Shaded', 'Morning'].includes(this.value)
  }

  /**
   * Returns true if this sector is good for cold days
   */
  isGoodForColdDays(): boolean {
    return ['Sun', 'Afternoon'].includes(this.value)
  }

  /**
   * Returns true if the sector is mostly shaded
   */
  isShaded(): boolean {
    return this.value === 'Shaded'
  }

  /**
   * Returns true if the sector gets full sun
   */
  isFullSun(): boolean {
    return this.value === 'Sun'
  }
}
