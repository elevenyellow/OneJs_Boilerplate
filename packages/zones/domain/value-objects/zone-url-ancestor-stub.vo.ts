export class ZoneUrlAncestorStub {
  private constructor(private readonly value: string | null) {}

  static create(value: string | null | undefined): ZoneUrlAncestorStub {
    if (!value || value.trim().length === 0) {
      return new ZoneUrlAncestorStub(null)
    }
    return new ZoneUrlAncestorStub(value.trim())
  }

  toString(): string | null {
    return this.value
  }

  isNull(): boolean {
    return this.value === null
  }

  equals(other: ZoneUrlAncestorStub): boolean {
    return this.value === other.value
  }
}
