/**
 * ClimbingStyle Value Object
 * Represents the climbing styles available in a sector
 */
export class ClimbingStyle {
  private static readonly VALID_VALUES = [
    'Slab',
    'Vertical',
    'Overhang',
    'Roof',
    'Arete',
    'Crack',
    'Chimney',
    'Dihedral',
    'Tufa',
    'Pockets',
    'Crimps',
  ] as const

  private constructor(private readonly values: string[]) {}

  static create(styles: unknown): ClimbingStyle {
    if (!styles) {
      return new ClimbingStyle([])
    }

    let parsed: string[] = []

    if (Array.isArray(styles)) {
      parsed = styles
        .filter((s): s is string => typeof s === 'string')
        .map((s) => s.trim())
    } else if (typeof styles === 'string') {
      parsed = styles
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    }

    // Normalize and validate
    const validated = parsed
      .map((style) => this.normalizeStyle(style))
      .filter((s): s is string => s !== null)
      .filter((v, i, arr) => arr.indexOf(v) === i) // Remove duplicates

    return new ClimbingStyle(validated)
  }

  private static normalizeStyle(style: string): string | null {
    const normalized =
      style.charAt(0).toUpperCase() + style.slice(1).toLowerCase()

    if (this.VALID_VALUES.includes(normalized as any)) {
      return normalized
    }

    // Try to map common variations
    const mapping: Record<string, string> = {
      placa: 'Slab',
      plate: 'Slab',
      dalle: 'Slab',
      vertical: 'Vertical',
      muro: 'Vertical',
      wall: 'Vertical',
      desplome: 'Overhang',
      devers: 'Overhang',
      overhang: 'Overhang',
      techo: 'Roof',
      roof: 'Roof',
      plafond: 'Roof',
      arista: 'Arete',
      arête: 'Arete',
      arete: 'Arete',
      fisura: 'Crack',
      crack: 'Crack',
      fissure: 'Crack',
      chimenea: 'Chimney',
      chimney: 'Chimney',
      cheminée: 'Chimney',
      diedro: 'Dihedral',
      dihedral: 'Dihedral',
      dièdre: 'Dihedral',
      corner: 'Dihedral',
      tufa: 'Tufa',
      toba: 'Tufa',
      agujeros: 'Pockets',
      pockets: 'Pockets',
      poches: 'Pockets',
      regletas: 'Crimps',
      crimps: 'Crimps',
      réglettes: 'Crimps',
    }

    const lowerNormalized = style.toLowerCase()
    return mapping[lowerNormalized] || null
  }

  static empty(): ClimbingStyle {
    return new ClimbingStyle([])
  }

  toArray(): string[] {
    return [...this.values]
  }

  toJSON(): string[] {
    return this.values
  }

  has(style: string): boolean {
    return this.values.includes(style)
  }

  isEmpty(): boolean {
    return this.values.length === 0
  }

  get count(): number {
    return this.values.length
  }

  equals(other: ClimbingStyle): boolean {
    if (this.values.length !== other.values.length) return false
    return this.values.every((v) => other.values.includes(v))
  }

  /**
   * Returns true if the sector has overhanging routes
   */
  hasOverhangs(): boolean {
    return this.has('Overhang') || this.has('Roof')
  }

  /**
   * Returns true if the sector has technical climbing
   */
  isTechnical(): boolean {
    return this.has('Slab') || this.has('Crimps') || this.has('Arete')
  }

  /**
   * Returns true if the sector is good for endurance training
   */
  isGoodForEndurance(): boolean {
    return this.has('Overhang') || this.has('Roof') || this.has('Tufa')
  }
}
