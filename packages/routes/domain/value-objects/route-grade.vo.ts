export class RouteGrade {
  private readonly value: string | null

  private constructor(value: string | null) {
    this.value = value
  }

  static createFrom(grade: string | null | undefined): RouteGrade {
    return new RouteGrade(grade?.trim() || null)
  }

  static createEmpty(): RouteGrade {
    return new RouteGrade(null)
  }

  getValue(): string | null {
    return this.value
  }

  hasValue(): boolean {
    return this.value !== null
  }

  equals(other: RouteGrade): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value || ''
  }
}
