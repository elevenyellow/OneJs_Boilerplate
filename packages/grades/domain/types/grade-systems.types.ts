/**
 * Supported grading systems for climbing routes
 */
export type GradeSystem =
  | 'french'
  | 'yds'
  | 'uiaa'
  | 'british'
  | 'font'
  | 'hueco'

/**
 * All supported grade systems
 */
export const GRADE_SYSTEMS: readonly GradeSystem[] = [
  'french',
  'yds',
  'uiaa',
  'british',
  'font',
  'hueco',
] as const

/**
 * Equivalents structure for all grade systems
 */
export interface GradeEquivalents {
  french: string | null
  yds: string | null
  uiaa: string | null
  british: string | null
  font: string | null
  hueco: string | null
}
