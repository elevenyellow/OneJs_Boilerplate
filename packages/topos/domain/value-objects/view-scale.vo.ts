export class ViewScale {
  private readonly value: number

  private constructor(value: number) {
    this.value = value
  }

  static createFrom(scale: number | null | undefined): ViewScale {
    return new ViewScale(scale ?? 1)
  }

  getValue(): number {
    return this.value
  }

  isScaled(): boolean {
    return this.value !== 1
  }

  scaleValue(value: number): number {
    return value * this.value
  }

  unscaleValue(value: number): number {
    if (this.value === 0) return value
    return value / this.value
  }

  equals(other: ViewScale): boolean {
    return this.value === other.value
  }

  toString(): string {
    return `${this.value}x`
  }
}
