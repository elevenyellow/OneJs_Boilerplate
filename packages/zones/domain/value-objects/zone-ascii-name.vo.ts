export class ZoneAsciiName {
  private constructor(private readonly value: string | null) {}

  static create(value: string | null | undefined): ZoneAsciiName {
    if (!value || value.trim().length === 0) {
      return new ZoneAsciiName(null)
    }
    return new ZoneAsciiName(value.trim())
  }

  toString(): string | null {
    return this.value
  }

  isNull(): boolean {
    return this.value === null
  }

  equals(other: ZoneAsciiName): boolean {
    return this.value === other.value
  }
}
