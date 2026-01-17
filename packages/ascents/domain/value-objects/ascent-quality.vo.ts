/**
 * Quality rating for an ascent (0-5 stars)
 */
export class AscentQuality {
  private static readonly MIN_VALUE = 0
  private static readonly MAX_VALUE = 5

  private constructor(private readonly value: number) {}

  static createFrom(value: number): AscentQuality {
    if (value < AscentQuality.MIN_VALUE || value > AscentQuality.MAX_VALUE) {
      throw new Error(
        `Invalid quality: ${value}. Must be between ${AscentQuality.MIN_VALUE} and ${AscentQuality.MAX_VALUE}.`,
      )
    }
    return new AscentQuality(Math.floor(value))
  }

  static zero(): AscentQuality {
    return new AscentQuality(0)
  }

  getValue(): number {
    return this.value
  }

  isRated(): boolean {
    return this.value > 0
  }

  equals(other: AscentQuality): boolean {
    return this.value === other.value
  }

  toString(): string {
    return `${this.value} stars`
  }
}
