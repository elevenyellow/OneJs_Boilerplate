/**
 * Ascent Data Mappers
 *
 * Converts form values (strings/enums) to numeric values expected by the backend API.
 * The backend stores numeric values, and the frontend only parses numbers to strings
 * when reading data for display (not when sending).
 */

import type {
  AscentStyle,
  GradeEvaluation,
  WallType,
  RouteCharacteristic,
  SafetyConcern,
} from '@/components/logbook/types'

/**
 * Maps ascent style string to numeric value
 * @param style - Ascent style string ('onsight' | 'flash' | 'redpoint' | 'go' | 'toprope')
 * @returns Numeric value (0-4)
 */
export function ascentStyleToNumber(style: AscentStyle): number {
  const mapping: Record<AscentStyle, number> = {
    onsight: 0,
    flash: 1,
    redpoint: 2,
    go: 3,
    toprope: 4,
  }
  return mapping[style]
}

/**
 * Maps grade evaluation string to numeric value
 * @param gradeEvaluation - Grade evaluation string ('soft' | 'normal' | 'hard')
 * @returns Numeric value (0-2)
 */
export function gradeEvaluationToNumber(
  gradeEvaluation: GradeEvaluation,
): number {
  const mapping: Record<GradeEvaluation, number> = {
    soft: 0,
    normal: 1,
    hard: 2,
  }
  return mapping[gradeEvaluation]
}

/**
 * Maps wall type string to numeric value
 * @param wallType - Wall type string ('slab' | 'vertical' | 'overhang' | 'roof') or null
 * @returns Numeric value (0-3) or null
 */
export function wallTypeToNumber(wallType: WallType | null): number | null {
  if (wallType === null) {
    return null
  }
  const mapping: Record<WallType, number> = {
    slab: 0,
    vertical: 1,
    overhang: 2,
    roof: 3,
  }
  return mapping[wallType]
}

/**
 * Maps route characteristics array to bitmask
 * @param chars - Array of route characteristics
 * @returns Bitmask value (combined with OR)
 */
export function characteristicsToBitmask(chars: RouteCharacteristic[]): number {
  const mapping: Record<RouteCharacteristic, number> = {
    cruxy: 1,
    athletic: 2,
    slopers: 4,
    endurance: 8,
    technical: 16,
    crimpy: 32,
  }

  return chars.reduce((bitmask, char) => {
    return bitmask | mapping[char]
  }, 0)
}

/**
 * Maps safety concerns array to bitmask
 * @param concerns - Array of safety concerns
 * @returns Bitmask value (combined with OR)
 */
export function safetyConcernsToBitmask(concerns: SafetyConcern[]): number {
  const mapping: Record<SafetyConcern, number> = {
    looseRock: 1,
    highFirstBolt: 2,
    badBolts: 4,
    badAnchor: 8,
  }

  return concerns.reduce((bitmask, concern) => {
    return bitmask | mapping[concern]
  }, 0)
}

/**
 * Converts universal grade index (10-52) to simplified grade band (1-5)
 * @param universalIndex - Universal grade index from route data
 * @returns Grade band (1=Beginner, 2=Intermediate, 3=Advanced, 4=Expert, 5=Elite)
 * @throws Error if universalIndex is outside valid range
 */
export function convertUniversalGradeIndexToGradeBand(
  universalIndex: number,
): number {
  if (universalIndex >= 10 && universalIndex <= 17) return 1 // Beginner
  if (universalIndex >= 18 && universalIndex <= 28) return 2 // Intermediate
  if (universalIndex >= 29 && universalIndex <= 37) return 3 // Advanced
  if (universalIndex >= 38 && universalIndex <= 45) return 4 // Expert
  if (universalIndex >= 46 && universalIndex <= 52) return 5 // Elite

  throw new Error(
    `Invalid universal grade index: ${universalIndex}. Must be between 10 and 52.`,
  )
}
