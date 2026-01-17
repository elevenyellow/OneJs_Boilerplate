import {
  GRADE_EVALUATION,
  GRADE_EVALUATION_LABELS,
  isValidGradeEvaluation,
  type GradeEvaluationValue,
} from '../mappings'

export class GradeEvaluation {
  private constructor(private readonly value: GradeEvaluationValue) {}

  static createFrom(value: number): GradeEvaluation {
    if (!isValidGradeEvaluation(value)) {
      throw new Error(`Invalid grade evaluation: ${value}. Must be 0-2.`)
    }
    return new GradeEvaluation(value)
  }

  static soft(): GradeEvaluation {
    return new GradeEvaluation(GRADE_EVALUATION.SOFT)
  }

  static normal(): GradeEvaluation {
    return new GradeEvaluation(GRADE_EVALUATION.NORMAL)
  }

  static hard(): GradeEvaluation {
    return new GradeEvaluation(GRADE_EVALUATION.HARD)
  }

  getValue(): GradeEvaluationValue {
    return this.value
  }

  getLabel(): string {
    return GRADE_EVALUATION_LABELS[this.value]
  }

  isSoft(): boolean {
    return this.value === GRADE_EVALUATION.SOFT
  }

  isNormal(): boolean {
    return this.value === GRADE_EVALUATION.NORMAL
  }

  isHard(): boolean {
    return this.value === GRADE_EVALUATION.HARD
  }

  equals(other: GradeEvaluation): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.getLabel()
  }
}
