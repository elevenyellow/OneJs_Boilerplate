/**
 * Value object for route annotation color.
 * Stores the hex color code for displaying the route on a topo.
 */
export class AnnotationColor {
  private static readonly DEFAULT_COLOR = '#6b7280' // Gray

  private constructor(private readonly value: string) {}

  static createFrom(value: string | null | undefined): AnnotationColor {
    if (!value || value.trim() === '') {
      return new AnnotationColor(AnnotationColor.DEFAULT_COLOR)
    }
    return new AnnotationColor(value.trim())
  }

  static getDefaultColor(): string {
    return AnnotationColor.DEFAULT_COLOR
  }

  getValue(): string {
    return this.value
  }

  equals(other: AnnotationColor): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
