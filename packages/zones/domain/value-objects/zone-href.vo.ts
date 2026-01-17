export class ZoneHref {
  private constructor(private readonly value: string | null) {}

  static create(value: string | null | undefined): ZoneHref {
    if (!value || value.trim().length === 0) {
      return new ZoneHref(null)
    }
    return new ZoneHref(value.trim())
  }

  toString(): string | null {
    return this.value
  }

  isNull(): boolean {
    return this.value === null
  }

  equals(other: ZoneHref): boolean {
    return this.value === other.value
  }
}
