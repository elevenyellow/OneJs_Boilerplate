import { GradeSystemDetector } from '@grades/domain/services/grade-system-detector'
import { GradeConverter } from '@grades/domain/services/grade-converter'

export class AnnotationGrade {
  private readonly grade: string | null
  private readonly gradeClass: string | null
  private readonly gradeBand: number | null

  private constructor(
    grade: string | null,
    gradeClass: string | null,
    gradeBand: number | null,
  ) {
    this.grade = grade
    this.gradeClass = gradeClass
    this.gradeBand = gradeBand
  }

  static createFrom(
    grade: string | null | undefined,
    gradeClass: string | null | undefined,
  ): AnnotationGrade {
    const gradeValue = grade || null
    let gradeBand: number | null = null

    // Convert grade string to gradeBand if possible
    if (gradeValue) {
      const detection = GradeSystemDetector.detect(gradeValue)
      if (detection && detection.system) {
        gradeBand =
          GradeConverter.toIndex(detection.normalizedValue, detection.system) ??
          null
      }
    }

    return new AnnotationGrade(gradeValue, gradeClass || null, gradeBand)
  }

  static createEmpty(): AnnotationGrade {
    return new AnnotationGrade(null, null, null)
  }

  getGrade(): string | null {
    return this.grade
  }

  getGradeClass(): string | null {
    return this.gradeClass
  }

  /**
   * Get universal grade index (gradeBand) for client-side conversion
   */
  getGradeBand(): number | null {
    return this.gradeBand
  }

  hasValue(): boolean {
    return this.grade !== null
  }

  equals(other: AnnotationGrade): boolean {
    return this.grade === other.grade && this.gradeClass === other.gradeClass
  }

  toString(): string {
    return this.grade || ''
  }
}
