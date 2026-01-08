/**
 * RouteType Value Object
 * Represents the climbing style/type of a route
 */
export type RouteTypeValue = 'sport' | 'trad' | 'boulder' | 'mixed'

export class RouteType {
  private static readonly VALID_TYPES: RouteTypeValue[] = [
    'sport',
    'trad',
    'boulder',
    'mixed',
  ]

  private constructor(private readonly value: RouteTypeValue) {}

  static create(type: string | null | undefined): RouteType | null {
    if (!type || typeof type !== 'string') {
      return null
    }

    const normalized = type.toLowerCase().trim() as RouteTypeValue

    if (!RouteType.VALID_TYPES.includes(normalized)) {
      return null
    }

    return new RouteType(normalized)
  }

  static sport(): RouteType {
    return new RouteType('sport')
  }

  static trad(): RouteType {
    return new RouteType('trad')
  }

  static boulder(): RouteType {
    return new RouteType('boulder')
  }

  static mixed(): RouteType {
    return new RouteType('mixed')
  }

  toString(): string {
    return this.value
  }

  isSport(): boolean {
    return this.value === 'sport'
  }

  isTrad(): boolean {
    return this.value === 'trad'
  }

  isBoulder(): boolean {
    return this.value === 'boulder'
  }

  isMixed(): boolean {
    return this.value === 'mixed'
  }

  equals(other: RouteType): boolean {
    return this.value === other.value
  }
}
