export class ZoneDepth {
  private constructor(private readonly value: number) {}

  static create(value: number | undefined): ZoneDepth {
    const depth = value ?? 0
    if (depth < 0) {
      throw new Error('ZoneDepth cannot be negative')
    }
    return new ZoneDepth(depth)
  }

  getValue(): number {
    return this.value
  }

  equals(other: ZoneDepth): boolean {
    return this.value === other.value
  }
}
