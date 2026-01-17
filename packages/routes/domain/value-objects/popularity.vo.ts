/**
 * Value Object representing route popularity.
 * Simplified to single field.
 */
export class Popularity {
  private readonly popularity: number | null

  private constructor(popularity: number | null) {
    this.popularity = popularity
  }

  static createFrom(popularity: number | null | undefined): Popularity {
    return new Popularity(popularity ?? null)
  }

  static createEmpty(): Popularity {
    return new Popularity(null)
  }

  getPopularity(): number | null {
    return this.popularity
  }

  getValue(): number | null {
    return this.popularity
  }

  hasValue(): boolean {
    return this.popularity !== null
  }

  equals(other: Popularity): boolean {
    return this.popularity === other.popularity
  }

  toString(): string {
    return this.popularity?.toString() || ''
  }
}
