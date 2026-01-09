/**
 * Orientation Value Object
 * Represents the cardinal direction a sector faces
 */
export class Orientation {
  private static readonly VALID_VALUES = [
    'N',
    'NE',
    'E',
    'SE',
    'S',
    'SW',
    'W',
    'NW',
    'Variable',
  ] as const

  private constructor(private readonly value: string) {}

  static create(orientation: unknown): Orientation | null {
    if (!orientation) return null

    const normalized = String(orientation).toUpperCase().trim()

    // Try exact match first
    if (this.VALID_VALUES.includes(normalized as any)) {
      return new Orientation(normalized)
    }

    // Try to parse common variations
    const mapping: Record<string, string> = {
      NORTH: 'N',
      NORTHEAST: 'NE',
      EAST: 'E',
      SOUTHEAST: 'SE',
      SOUTH: 'S',
      SOUTHWEST: 'SW',
      WEST: 'W',
      NORTHWEST: 'NW',
      'N-E': 'NE',
      'S-E': 'SE',
      'S-W': 'SW',
      'N-W': 'NW',
      MIXED: 'Variable',
      ALL: 'Variable',
      VARIOUS: 'Variable',
    }

    const mapped = mapping[normalized]
    if (mapped) {
      return new Orientation(mapped)
    }

    // If we can't parse it, return null (ignore invalid values)
    return null
  }

  toString(): string {
    return this.value
  }

  toJSON(): string {
    return this.value
  }

  equals(other: Orientation): boolean {
    return this.value === other.value
  }

  /**
   * Returns true if this orientation gets direct sun exposure
   */
  getsSun(): boolean {
    return ['N', 'NE', 'E', 'SE', 'S', 'Variable'].includes(this.value)
  }

  /**
   * Returns true if this orientation is good for summer (shaded)
   */
  isGoodForSummer(): boolean {
    return ['N', 'NE', 'NW'].includes(this.value)
  }

  /**
   * Returns true if this orientation is good for winter (sunny)
   */
  isGoodForWinter(): boolean {
    return ['S', 'SE', 'SW'].includes(this.value)
  }
}
