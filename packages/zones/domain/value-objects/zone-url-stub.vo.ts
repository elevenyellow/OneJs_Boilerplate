export class ZoneUrlStub {
  private constructor(private readonly value: string | null) {}

  static create(value: string | null | undefined): ZoneUrlStub {
    if (!value || value.trim().length === 0) {
      return new ZoneUrlStub(null)
    }
    return new ZoneUrlStub(value.trim())
  }

  toString(): string | null {
    return this.value
  }

  isNull(): boolean {
    return this.value === null
  }

  equals(other: ZoneUrlStub): boolean {
    return this.value === other.value
  }
}
