/**
 * Types for the Logbook / Log Ascent feature
 */

export type AscentStyle = 'onsight' | 'flash' | 'redpoint' | 'go' | 'toprope'

export type GradeEvaluation = 'soft' | 'normal' | 'hard'

export type WallType = 'slab' | 'vertical' | 'overhang' | 'roof'

export type RouteCharacteristic =
  | 'cruxy'
  | 'athletic'
  | 'slopers'
  | 'endurance'
  | 'technical'
  | 'crimpy'

/** Safety concerns that can be flagged for a route */
export type SafetyConcern =
  | 'looseRock'
  | 'highFirstBolt'
  | 'badBolts'
  | 'badAnchor'

export interface LogAscentFormState {
  style: AscentStyle
  date: Date
  isRepeat: boolean
  tries: number // Number of attempts
  gradeEvaluation: GradeEvaluation
  wallType: WallType | null
  characteristics: RouteCharacteristic[]
  safetyConcerns: SafetyConcern[] // Safety issues observed
  quality: number
  comments: string
}

export const DEFAULT_LOG_ASCENT_FORM: LogAscentFormState = {
  style: 'redpoint',
  date: new Date(),
  isRepeat: false,
  tries: 1,
  gradeEvaluation: 'normal',
  wallType: null,
  characteristics: [],
  safetyConcerns: [],
  quality: 0,
  comments: '',
}
