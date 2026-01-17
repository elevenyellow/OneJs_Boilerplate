export class ZonePosition {
  private constructor(private readonly value: number) {}

  static create(value: number | undefined): ZonePosition {
    const position = value ?? 0
    if (position < 0) {
      throw new Error('ZonePosition cannot be negative')
    }
    return new ZonePosition(position)
  }

  getValue(): number {
    return this.value
  }

  equals(other: ZonePosition): boolean {
    return this.value === other.value
  }
}
