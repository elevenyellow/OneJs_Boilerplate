/**
 * Value Object representing route height.
 * Display value is computed on-demand, not stored.
 */
export class RouteHeight {
  private readonly value: number | null
  private readonly unit: string

  private constructor(value: number | null, unit: string) {
    this.value = value
    this.unit = unit
  }

  static createFrom(
    height: number | null | undefined,
    unit?: string | null,
  ): RouteHeight {
    return new RouteHeight(height ?? null, unit || 'm')
  }

  static createFromTuple(
    tuple: [number | string, string] | null | undefined,
  ): RouteHeight {
    if (!tuple) return RouteHeight.createEmpty()
    const value =
      typeof tuple[0] === 'string' ? Number.parseFloat(tuple[0]) : tuple[0]
    return new RouteHeight(Number.isNaN(value) ? null : value, tuple[1] || 'm')
  }

  static createEmpty(): RouteHeight {
    return new RouteHeight(null, 'm')
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

  /**
   * Get formatted display value (computed on-demand)
   */
  getFormattedValue(): string {
    if (this.value === null) return ''
    return `${this.value}${this.unit}`
  }

  equals(other: RouteHeight): boolean {
    return this.value === other.value && this.unit === other.unit
  }

  toString(): string {
    return this.getFormattedValue()
  }
}
