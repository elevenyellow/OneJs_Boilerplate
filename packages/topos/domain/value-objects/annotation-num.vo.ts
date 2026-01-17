export class AnnotationNum {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  static createFrom(num: string | null | undefined): AnnotationNum {
    return new AnnotationNum(num || '')
  }

  getValue(): string {
    return this.value
  }

  hasValue(): boolean {
    return this.value !== ''
  }

  getNumericValue(): number | null {
    const parsed = parseInt(this.value, 10)
    return isNaN(parsed) ? null : parsed
  }

  equals(other: AnnotationNum): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
