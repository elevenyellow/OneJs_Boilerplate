export class ZoneName {
  private constructor(private readonly value: string) {}

  static create(value: string): ZoneName {
    if (!value || value.trim().length === 0) {
      throw new Error('ZoneName cannot be empty')
    }
    return new ZoneName(value.trim())
  }

  toString(): string {
    return this.value
  }

  equals(other: ZoneName): boolean {
    return this.value === other.value
  }
}
