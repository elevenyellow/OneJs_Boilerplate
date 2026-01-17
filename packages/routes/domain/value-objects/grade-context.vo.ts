/**
 * Value Object representing grade in geographic context.
 * Simplified to single field - context info merged into gradeInContext.
 */
export class GradeContext {
  private readonly gradeInContext: string | null

  private constructor(gradeInContext: string | null) {
    this.gradeInContext = gradeInContext
  }

  static createFrom(gradeInContext: string | null | undefined): GradeContext {
    return new GradeContext(gradeInContext || null)
  }

  static createEmpty(): GradeContext {
    return new GradeContext(null)
  }

  getGradeInContext(): string | null {
    return this.gradeInContext
  }

  hasValue(): boolean {
    return this.gradeInContext !== null
  }

  equals(other: GradeContext): boolean {
    return this.gradeInContext === other.gradeInContext
  }

  toString(): string {
    return this.gradeInContext || ''
  }
}
