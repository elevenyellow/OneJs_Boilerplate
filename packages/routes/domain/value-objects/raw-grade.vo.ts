export class RawGrade {
  private readonly min: number | null
  private readonly max: number | null

  private constructor(min: number | null, max: number | null) {
    this.min = min
    this.max = max
  }

  static createFrom(
    rawGrade: [number, number] | null | undefined,
  ): RawGrade {
    if (!rawGrade) return RawGrade.createEmpty()
    return new RawGrade(rawGrade[0], rawGrade[1])
  }

  static createFromValues(
    min: number | null | undefined,
    max: number | null | undefined,
  ): RawGrade {
    return new RawGrade(min ?? null, max ?? null)
  }

  static createEmpty(): RawGrade {
    return new RawGrade(null, null)
  }

  getMin(): number | null {
    return this.min
  }

  getMax(): number | null {
    return this.max
  }

  hasValue(): boolean {
    return this.min !== null && this.max !== null
  }

  toTuple(): [number, number] | null {
    if (!this.hasValue()) return null
    return [this.min!, this.max!]
  }

  equals(other: RawGrade): boolean {
    return this.min === other.min && this.max === other.max
  }

  toString(): string {
    if (!this.hasValue()) return ''
    return `${this.min}-${this.max}`
  }
}
