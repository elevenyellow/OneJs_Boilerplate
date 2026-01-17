/**
 * Value Object representing route climbing style.
 * Simplified to single field - styleStub was redundant.
 */
export class RouteStyle {
  private readonly style: string | null

  private constructor(style: string | null) {
    this.style = style
  }

  static createFrom(style: string | null | undefined): RouteStyle {
    return new RouteStyle(style || null)
  }

  static createEmpty(): RouteStyle {
    return new RouteStyle(null)
  }

  getStyle(): string | null {
    return this.style
  }

  hasValue(): boolean {
    return this.style !== null
  }

  getDisplayStyle(): string {
    return this.style || 'Unknown'
  }

  equals(other: RouteStyle): boolean {
    return this.style === other.style
  }

  toString(): string {
    return this.getDisplayStyle()
  }
}
