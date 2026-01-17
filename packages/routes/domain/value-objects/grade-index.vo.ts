export class GradeIndex {
  private readonly value: number | null

  private constructor(value: number | null) {
    this.value = value
  }

  static createFrom(index: number | null | undefined): GradeIndex {
    return new GradeIndex(index ?? null)
  }

  static createEmpty(): GradeIndex {
    return new GradeIndex(null)
  }

  getValue(): number | null {
    return this.value
  }

  hasValue(): boolean {
    return this.value !== null
  }

  isHarderThan(other: GradeIndex): boolean {
    if (this.value === null || other.value === null) return false
    return this.value > other.value
  }

  isEasierThan(other: GradeIndex): boolean {
    if (this.value === null || other.value === null) return false
    return this.value < other.value
  }

  equals(other: GradeIndex): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value?.toString() || ''
  }
}
