export class CragName {
  private readonly value: string
  private readonly asciiValue: string | null

  private constructor(value: string, asciiValue: string | null) {
    this.value = value
    this.asciiValue = asciiValue
  }

  static createFrom(name: string, asciiName?: string | null): CragName {
    if (!name || name.trim() === '') {
      throw new Error('CragName cannot be empty')
    }
    return new CragName(name.trim(), asciiName?.trim() || null)
  }

  getValue(): string {
    return this.value
  }

  getAsciiValue(): string | null {
    return this.asciiValue
  }

  getSearchableValue(): string {
    return this.asciiValue || this.value
  }

  equals(other: CragName): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
