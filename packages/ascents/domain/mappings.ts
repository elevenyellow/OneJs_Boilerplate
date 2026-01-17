/**
 * Ascent Data Mappings
 *
 * Numeric mappings for compact API payloads.
 * Frontend uses these to encode/decode values.
 */

// =============================================================================
// Ascent Style
// =============================================================================

export const ASCENT_STYLE = {
  ONSIGHT: 0,
  FLASH: 1,
  REDPOINT: 2,
  GO: 3,
  TOPROPE: 4,
} as const

export type AscentStyleValue = (typeof ASCENT_STYLE)[keyof typeof ASCENT_STYLE]

export const ASCENT_STYLE_LABELS: Record<AscentStyleValue, string> = {
  [ASCENT_STYLE.ONSIGHT]: 'onsight',
  [ASCENT_STYLE.FLASH]: 'flash',
  [ASCENT_STYLE.REDPOINT]: 'redpoint',
  [ASCENT_STYLE.GO]: 'go',
  [ASCENT_STYLE.TOPROPE]: 'toprope',
}

// =============================================================================
// Grade Evaluation
// =============================================================================

export const GRADE_EVALUATION = {
  SOFT: 0,
  NORMAL: 1,
  HARD: 2,
} as const

export type GradeEvaluationValue =
  (typeof GRADE_EVALUATION)[keyof typeof GRADE_EVALUATION]

export const GRADE_EVALUATION_LABELS: Record<GradeEvaluationValue, string> = {
  [GRADE_EVALUATION.SOFT]: 'soft',
  [GRADE_EVALUATION.NORMAL]: 'normal',
  [GRADE_EVALUATION.HARD]: 'hard',
}

// =============================================================================
// Wall Type
// =============================================================================

export const WALL_TYPE = {
  SLAB: 0,
  VERTICAL: 1,
  OVERHANG: 2,
  ROOF: 3,
} as const

export type WallTypeValue = (typeof WALL_TYPE)[keyof typeof WALL_TYPE]

export const WALL_TYPE_LABELS: Record<WallTypeValue, string> = {
  [WALL_TYPE.SLAB]: 'slab',
  [WALL_TYPE.VERTICAL]: 'vertical',
  [WALL_TYPE.OVERHANG]: 'overhang',
  [WALL_TYPE.ROOF]: 'roof',
}

// =============================================================================
// Route Characteristics (Bitmask)
// =============================================================================

export const CHARACTERISTIC = {
  CRUXY: 1,
  ATHLETIC: 2,
  SLOPERS: 4,
  ENDURANCE: 8,
  TECHNICAL: 16,
  CRIMPY: 32,
} as const

export type CharacteristicFlag =
  (typeof CHARACTERISTIC)[keyof typeof CHARACTERISTIC]

export const CHARACTERISTIC_LABELS: Record<CharacteristicFlag, string> = {
  [CHARACTERISTIC.CRUXY]: 'cruxy',
  [CHARACTERISTIC.ATHLETIC]: 'athletic',
  [CHARACTERISTIC.SLOPERS]: 'slopers',
  [CHARACTERISTIC.ENDURANCE]: 'endurance',
  [CHARACTERISTIC.TECHNICAL]: 'technical',
  [CHARACTERISTIC.CRIMPY]: 'crimpy',
}

// =============================================================================
// Safety Concerns (Bitmask)
// =============================================================================

export const SAFETY_CONCERN = {
  LOOSE_ROCK: 1,
  HIGH_FIRST_BOLT: 2,
  BAD_BOLTS: 4,
  BAD_ANCHOR: 8,
} as const

export type SafetyConcernFlag =
  (typeof SAFETY_CONCERN)[keyof typeof SAFETY_CONCERN]

export const SAFETY_CONCERN_LABELS: Record<SafetyConcernFlag, string> = {
  [SAFETY_CONCERN.LOOSE_ROCK]: 'looseRock',
  [SAFETY_CONCERN.HIGH_FIRST_BOLT]: 'highFirstBolt',
  [SAFETY_CONCERN.BAD_BOLTS]: 'badBolts',
  [SAFETY_CONCERN.BAD_ANCHOR]: 'badAnchor',
}

// =============================================================================
// Grade Band (1-5, matches Route.gradeBand)
// =============================================================================

export const GRADE_BAND = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
  EXPERT: 4,
  ELITE: 5,
} as const

export type GradeBandValue = (typeof GRADE_BAND)[keyof typeof GRADE_BAND]

export const GRADE_BAND_LABELS: Record<GradeBandValue, string> = {
  [GRADE_BAND.BEGINNER]: 'beginner',
  [GRADE_BAND.INTERMEDIATE]: 'intermediate',
  [GRADE_BAND.ADVANCED]: 'advanced',
  [GRADE_BAND.EXPERT]: 'expert',
  [GRADE_BAND.ELITE]: 'elite',
}

// =============================================================================
// Validation Helpers
// =============================================================================

export function isValidAscentStyle(value: number): value is AscentStyleValue {
  return value >= 0 && value <= 4
}

export function isValidGradeEvaluation(
  value: number,
): value is GradeEvaluationValue {
  return value >= 0 && value <= 2
}

export function isValidWallType(value: number): value is WallTypeValue {
  return value >= 0 && value <= 3
}

export function isValidGradeBand(value: number): value is GradeBandValue {
  return value >= 1 && value <= 5
}
