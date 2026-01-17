export class ZIndex {
  private readonly value: string | null

  private constructor(value: string | null) {
    this.value = value
  }

  static createFrom(zindex: string | null | undefined): ZIndex {
    return new ZIndex(zindex || null)
  }

  static createEmpty(): ZIndex {
    return new ZIndex(null)
  }

  getValue(): string | null {
    return this.value
  }

  getNumericValue(): number {
    if (!this.value) return 1
    const parsed = parseInt(this.value, 10)
    return isNaN(parsed) ? 1 : parsed
  }

  hasValue(): boolean {
    return this.value !== null
  }

  equals(other: ZIndex): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value || '1'
  }
}
