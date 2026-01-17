export class AverageHeight {
  private readonly value: number | null
  private readonly unit: string

  private constructor(value: number | null, unit: string) {
    this.value = value
    this.unit = unit
  }

  static createFrom(
    height: number | null | undefined,
    unit?: string | null,
  ): AverageHeight {
    return new AverageHeight(height ?? null, unit || 'm')
  }

  static createFromTuple(
    tuple: [number | string, string] | null | undefined,
  ): AverageHeight {
    if (!tuple) return AverageHeight.createEmpty()
    const value = typeof tuple[0] === 'string' ? parseFloat(tuple[0]) : tuple[0]
    return new AverageHeight(isNaN(value) ? null : value, tuple[1] || 'm')
  }

  static createEmpty(): AverageHeight {
    return new AverageHeight(null, 'm')
  }

  getValue(): number | null {
    return this.value
  }

  getUnit(): string {
    return this.unit
  }

  hasValue(): boolean {
    return this.value !== null
  }

  getInMeters(): number | null {
    if (this.value === null) return null
    if (this.unit === 'ft') {
      return this.value * 0.3048
    }
    return this.value
  }

  getDisplayValue(): string {
    if (this.value === null) return ''
    return `${this.value}${this.unit}`
  }

  equals(other: AverageHeight): boolean {
    return this.value === other.value && this.unit === other.unit
  }

  toString(): string {
    return this.getDisplayValue()
  }
}
