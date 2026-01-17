export class SectorDepth {
  private readonly value: number

  private constructor(value: number) {
    this.value = value
  }

  static createFrom(depth: number | null | undefined): SectorDepth {
    return new SectorDepth(depth ?? 0)
  }

  getValue(): number {
    return this.value
  }

  isTopLevel(): boolean {
    return this.value === 0 || this.value === 1
  }

  isNested(): boolean {
    return this.value > 1
  }

  getLevel(): number {
    return this.value
  }

  equals(other: SectorDepth): boolean {
    return this.value === other.value
  }

  toString(): string {
    return String(this.value)
  }
}
