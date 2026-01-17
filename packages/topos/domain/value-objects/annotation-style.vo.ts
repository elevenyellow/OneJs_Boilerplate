export class AnnotationStyle {
  private readonly value: string | null

  private constructor(value: string | null) {
    this.value = value
  }

  static createFrom(style: string | null | undefined): AnnotationStyle {
    return new AnnotationStyle(style || null)
  }

  static createEmpty(): AnnotationStyle {
    return new AnnotationStyle(null)
  }

  getValue(): string | null {
    return this.value
  }

  hasValue(): boolean {
    return this.value !== null
  }

  equals(other: AnnotationStyle): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value || ''
  }
}
