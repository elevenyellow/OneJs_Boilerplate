export type AnnotationTypeValue = 'route' | 'area'

export class AnnotationType {
  private readonly value: AnnotationTypeValue

  private constructor(value: AnnotationTypeValue) {
    this.value = value
  }

  static createFrom(type: string): AnnotationType {
    const normalizedType = type.toLowerCase() as AnnotationTypeValue
    if (normalizedType !== 'route' && normalizedType !== 'area') {
      return new AnnotationType('route') // default to route
    }
    return new AnnotationType(normalizedType)
  }

  static route(): AnnotationType {
    return new AnnotationType('route')
  }

  static area(): AnnotationType {
    return new AnnotationType('area')
  }

  getValue(): AnnotationTypeValue {
    return this.value
  }

  isRoute(): boolean {
    return this.value === 'route'
  }

  isArea(): boolean {
    return this.value === 'area'
  }

  equals(other: AnnotationType): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
