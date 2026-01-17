export class AreaSize {
  private readonly value: number | null

  private constructor(value: number | null) {
    this.value = value
  }

  static createFrom(areaSize: number | null | undefined): AreaSize {
    if (areaSize === null || areaSize === undefined) {
      return new AreaSize(null)
    }
    return new AreaSize(areaSize)
  }

  static createEmpty(): AreaSize {
    return new AreaSize(null)
  }

  getValue(): number | null {
    return this.value
  }

  hasValue(): boolean {
    return this.value !== null
  }

  getValueInSquareKm(): number | null {
    if (this.value === null) return null
    return this.value / 1_000_000
  }

  equals(other: AreaSize): boolean {
    return this.value === other.value
  }

  toString(): string {
    if (this.value === null) return 'Unknown area'
    return `${this.value} m²`
  }
}
