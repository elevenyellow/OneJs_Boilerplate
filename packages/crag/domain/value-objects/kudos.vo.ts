/**
 * Value Object: Kudos
 * Represents the kudos/rating count for a crag
 */

export class Kudos {
  private constructor(private readonly value: number) {}

  static create(kudos: unknown): Kudos | null {
    if (kudos === null || kudos === undefined) return null
    
    const num = Number(kudos)
    if (isNaN(num) || num < 0) return null
    
    return new Kudos(Math.round(num))
  }

  toNumber(): number {
    return this.value
  }

  toJSON(): number {
    return this.value
  }

  toString(): string {
    return this.value.toString()
  }

  equals(other: Kudos): boolean {
    return this.value === other.value
  }

  isHighlyRated(): boolean {
    return this.value >= 100
  }

  isPopular(): boolean {
    return this.value >= 50
  }

  hasRating(): boolean {
    return this.value > 0
  }
}
