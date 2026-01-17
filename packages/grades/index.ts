// Domain Services
export { GradeConverter } from './domain/services/grade-converter'
export { GradeSystemDetector } from './domain/services/grade-system-detector'
export type { DetectionResult } from './domain/services/grade-system-detector'
export {
  getGradeCategory,
  getGradeCategoryThresholds,
  getGradeCategoryColor,
  getGradeColor,
  type GradeCategory,
} from './domain/services/grade-category'
export {
  calculateGradeIndex,
  calculateGradeIndexOrZero,
} from './domain/services/grade-index-calculator'

// Types
export type { GradeSystem } from './domain/types/grade-systems.types'

// Value Objects
export { NormalizedGrade } from './domain/value-objects/normalized-grade.vo'
