export class AnnotationOrder {
  private readonly value: number

  private constructor(value: number) {
    this.value = value
  }

  static createFrom(order: number | null | undefined): AnnotationOrder {
    return new AnnotationOrder(order ?? 0)
  }

  getValue(): number {
    return this.value
  }

  equals(other: AnnotationOrder): boolean {
    return this.value === other.value
  }

  compareTo(other: AnnotationOrder): number {
    return this.value - other.value
  }

  toString(): string {
    return String(this.value)
  }
}
