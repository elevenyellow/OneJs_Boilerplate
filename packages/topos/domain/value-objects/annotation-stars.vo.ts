export class AnnotationStars {
  private readonly value: string | null

  private constructor(value: string | null) {
    this.value = value
  }

  static createFrom(stars: string | null | undefined): AnnotationStars {
    return new AnnotationStars(stars || null)
  }

  static createEmpty(): AnnotationStars {
    return new AnnotationStars(null)
  }

  getValue(): string | null {
    return this.value
  }

  getNumericValue(): number {
    if (!this.value) return 0
    const parsed = parseInt(this.value, 10)
    return isNaN(parsed) ? 0 : parsed
  }

  hasValue(): boolean {
    return this.value !== null
  }

  equals(other: AnnotationStars): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value || ''
  }
}
