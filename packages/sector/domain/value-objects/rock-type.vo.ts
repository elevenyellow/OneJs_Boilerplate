/**
 * RockType Value Object
 * Represents the type of rock in a sector
 */
export class RockType {
  private static readonly VALID_VALUES = [
    'Limestone',
    'Granite',
    'Sandstone',
    'Conglomerate',
    'Slate',
    'Gneiss',
    'Basalt',
    'Quartzite',
    'Volcanic',
    'Schist',
    'Other',
  ] as const

  private constructor(private readonly value: string) {}

  static create(rockType: unknown): RockType | null {
    if (!rockType) return null

    const normalized = String(rockType).trim()
    const capitalizedFirst =
      normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase()

    // Try exact match with capitalized
    if (this.VALID_VALUES.includes(capitalizedFirst as any)) {
      return new RockType(capitalizedFirst)
    }

    // Try to map common variations
    const mapping: Record<string, string> = {
      caliza: 'Limestone',
      calcaire: 'Limestone',
      kalkstein: 'Limestone',
      granito: 'Granite',
      granit: 'Granite',
      arenisca: 'Sandstone',
      'grès': 'Sandstone',
      conglomerado: 'Conglomerate',
      pizarra: 'Slate',
      esquisto: 'Schist',
      basalto: 'Basalt',
      volcánica: 'Volcanic',
      volcanic: 'Volcanic',
      cuarcita: 'Quartzite',
      quartz: 'Quartzite',
    }

    const lowerNormalized = normalized.toLowerCase()
    const mapped = mapping[lowerNormalized]
    if (mapped) {
      return new RockType(mapped)
    }

    // If we can't parse it, return "Other"
    return new RockType('Other')
  }

  toString(): string {
    return this.value
  }

  toJSON(): string {
    return this.value
  }

  equals(other: RockType): boolean {
    return this.value === other.value
  }

  /**
   * Returns true if this rock type typically has good friction
   */
  hasGoodFriction(): boolean {
    return ['Sandstone', 'Granite', 'Quartzite'].includes(this.value)
  }

  /**
   * Returns true if this rock type is typically pocketed
   */
  isPocketed(): boolean {
    return ['Limestone', 'Volcanic', 'Basalt'].includes(this.value)
  }
}
