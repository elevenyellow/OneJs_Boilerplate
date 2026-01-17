export class FirstAscent {
  private readonly value: string | null

  private constructor(value: string | null) {
    this.value = value
  }

  static createFrom(firstAscent: string | null | undefined): FirstAscent {
    return new FirstAscent(firstAscent?.trim() || null)
  }

  static createEmpty(): FirstAscent {
    return new FirstAscent(null)
  }

  getValue(): string | null {
    return this.value
  }

  hasValue(): boolean {
    return this.value !== null
  }

  equals(other: FirstAscent): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value || ''
  }
}
