export class Depth {
  private readonly value: number | null

  private constructor(value: number | null) {
    this.value = value
  }

  static createFrom(depth: number | null | undefined): Depth {
    return new Depth(depth ?? null)
  }

  static createEmpty(): Depth {
    return new Depth(null)
  }

  getValue(): number | null {
    return this.value
  }

  hasValue(): boolean {
    return this.value !== null
  }

  equals(other: Depth): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value?.toString() || ''
  }
}
