export class AnnotationName {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  static createFrom(name: string): AnnotationName {
    return new AnnotationName(name || '')
  }

  getValue(): string {
    return this.value
  }

  hasValue(): boolean {
    return this.value !== ''
  }

  equals(other: AnnotationName): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
