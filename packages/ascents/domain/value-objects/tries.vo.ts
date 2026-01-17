/**
 * Number of tries/attempts for an ascent
 */
export class Tries {
  private static readonly MIN_VALUE = 1

  private constructor(private readonly value: number) {}

  static createFrom(value: number): Tries {
    if (value < Tries.MIN_VALUE) {
      throw new Error(
        `Invalid tries: ${value}. Must be at least ${Tries.MIN_VALUE}.`,
      )
    }
    return new Tries(Math.floor(value))
  }

  static one(): Tries {
    return new Tries(1)
  }

  getValue(): number {
    return this.value
  }

  isFirstTry(): boolean {
    return this.value === 1
  }

  equals(other: Tries): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value === 1 ? '1 try' : `${this.value} tries`
  }
}
