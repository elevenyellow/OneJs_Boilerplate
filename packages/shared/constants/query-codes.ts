/**
 * Compact query parameter codes for API optimization
 *
 * ⚠️ IMPORTANT: These codes are part of the API contract.
 * NEVER change existing codes - only add new ones at the end.
 *
 * @see docs/api-query-codes.md for full documentation
 */

// ============================================
// GRADE SYSTEM
// ============================================

export const GradeSystemCode = {
  FRENCH: 1,
  YDS: 2,
  UIAA: 3,
  BRITISH: 4,
  FONT: 5,
  HUECO: 6,
} as const

export type GradeSystemCode =
  (typeof GradeSystemCode)[keyof typeof GradeSystemCode]

export const GRADE_SYSTEM_FROM_CODE: Record<number, string> = {
  1: 'french',
  2: 'yds',
  3: 'uiaa',
  4: 'british',
  5: 'font',
  6: 'hueco',
}

export const GRADE_SYSTEM_TO_CODE: Record<string, number> = {
  french: 1,
  yds: 2,
  uiaa: 3,
  british: 4,
  font: 5,
  hueco: 6,
}

// ============================================
// SEASON PREFERENCE
// ============================================

export const SeasonCode = {
  ANY: 0,
  SUMMER: 1,
  WINTER: 2,
} as const

export type SeasonCode = (typeof SeasonCode)[keyof typeof SeasonCode]

export const SEASON_FROM_CODE: Record<number, string> = {
  0: 'any',
  1: 'summer',
  2: 'winter',
}

export const SEASON_TO_CODE: Record<string, number> = {
  any: 0,
  summer: 1,
  winter: 2,
}

// ============================================
// EXPOSURE PREFERENCE (SUN/SHADOW)
// ============================================

export const ExposureCode = {
  ANY: 0,
  SUN: 1,
  SHADE: 2,
} as const

export type ExposureCode = (typeof ExposureCode)[keyof typeof ExposureCode]

export const EXPOSURE_FROM_CODE: Record<number, string> = {
  0: 'any',
  1: 'sun',
  2: 'shade',
}

export const EXPOSURE_TO_CODE: Record<string, number> = {
  any: 0,
  sun: 1,
  shade: 2,
}

// ============================================
// DISTANCE UNIT
// ============================================

export const DistanceUnitCode = {
  KILOMETERS: 1,
  MILES: 2,
} as const

export type DistanceUnitCode =
  (typeof DistanceUnitCode)[keyof typeof DistanceUnitCode]

export const DISTANCE_UNIT_FROM_CODE: Record<number, string> = {
  1: 'km',
  2: 'mi',
}

export const DISTANCE_UNIT_TO_CODE: Record<string, number> = {
  km: 1,
  kilometers: 1,
  mi: 2,
  miles: 2,
}

/** Conversion factor: 1 mile = 1.60934 km */
export const MILES_TO_KM = 1.60934

// ============================================
// WEATHER CONDITION
// ============================================

export const WeatherConditionCode = {
  ALL_DAY_SUN: 1,
  MORNING_SUN: 2,
  NOON_SUN: 3,
  AFTERNOON_SUN: 4,
  ALL_DAY_SHADE: 5,
  MORNING_SHADE: 6,
  AFTERNOON_SHADE: 7,
} as const

export type WeatherConditionCode =
  (typeof WeatherConditionCode)[keyof typeof WeatherConditionCode]

export const WEATHER_FROM_CODE: Record<number, string> = {
  1: 'ALL_DAY_SUN',
  2: 'MORNING_SUN',
  3: 'NOON_SUN',
  4: 'AFTERNOON_SUN',
  5: 'ALL_DAY_SHADE',
  6: 'MORNING_SHADE',
  7: 'AFTERNOON_SHADE',
}

// ============================================
// CROWD LEVEL
// ============================================

export const CrowdLevelCode = {
  DESERTED: 1,
  QUIET: 2,
  BUSY: 3,
  CROWDED: 4,
} as const

export type CrowdLevelCode =
  (typeof CrowdLevelCode)[keyof typeof CrowdLevelCode]

export const CROWD_FROM_CODE: Record<number, string> = {
  1: 'DESERTED',
  2: 'QUIET',
  3: 'BUSY',
  4: 'CROWDED',
}

// ============================================
// WALK-IN TIME
// ============================================

export const WalkInTimeCode = {
  UNDER_5_MIN: 1,
  FROM_5_TO_10_MIN: 2,
  FROM_10_TO_20_MIN: 3,
  FROM_20_TO_30_MIN: 4,
  FROM_30_TO_45_MIN: 5,
  FROM_45_TO_60_MIN: 6,
  OVER_60_MIN: 7,
} as const

export type WalkInTimeCode =
  (typeof WalkInTimeCode)[keyof typeof WalkInTimeCode]

export const WALK_IN_FROM_CODE: Record<number, string> = {
  1: 'UNDER_5_MIN',
  2: 'FROM_5_TO_10_MIN',
  3: 'FROM_10_TO_20_MIN',
  4: 'FROM_20_TO_30_MIN',
  5: 'FROM_30_TO_45_MIN',
  6: 'FROM_45_TO_60_MIN',
  7: 'OVER_60_MIN',
}

// ============================================
// ASPECT DIRECTION
// ============================================

export const AspectCode = {
  N: 1,
  NE: 2,
  E: 3,
  SE: 4,
  S: 5,
  SW: 6,
  W: 7,
  NW: 8,
} as const

export type AspectCode = (typeof AspectCode)[keyof typeof AspectCode]

export const ASPECT_FROM_CODE: Record<number, string> = {
  1: 'N',
  2: 'NE',
  3: 'E',
  4: 'SE',
  5: 'S',
  6: 'SW',
  7: 'W',
  8: 'NW',
}

// ============================================
// FAMILY FRIENDLY
// ============================================

export const FamilyCode = {
  ANY: 0,
  KID_FRIENDLY: 1,
  NOT_KID_FRIENDLY: 2,
} as const

export type FamilyCode = (typeof FamilyCode)[keyof typeof FamilyCode]

export const FAMILY_FROM_CODE: Record<number, string> = {
  0: 'any',
  1: 'KID_FRIENDLY',
  2: 'NOT_KID_FRIENDLY',
}

// ============================================
// CLIMBING STYLE
// ============================================

export const ClimbingStyleCode = {
  SLAB: 1,
  VERTICAL: 2,
  OVERHANG: 3,
  ROOF: 4,
  CRACK: 5,
  ARETE: 6,
  CORNER: 7,
  CHIMNEY: 8,
} as const

export type ClimbingStyleCode =
  (typeof ClimbingStyleCode)[keyof typeof ClimbingStyleCode]

export const STYLE_FROM_CODE: Record<number, string> = {
  1: 'SLAB',
  2: 'VERTICAL',
  3: 'OVERHANG',
  4: 'ROOF',
  5: 'CRACK',
  6: 'ARETE',
  7: 'CORNER',
  8: 'CHIMNEY',
}

// ============================================
// GRADE INDEX CONSTANTS
// ============================================

export const GradeIndex = {
  MIN: 10,
  MAX: 46,
  MEDIUM_START: 24,
  HARD_START: 30,
  EXTREME_START: 36,
} as const

// ============================================
// QUERY PARAM SHORT NAMES
// ============================================

export const QueryParam = {
  LATITUDE: 'lat',
  LONGITUDE: 'lng',
  RADIUS: 'r',
  DISTANCE_UNIT: 'du',
  MIN_GRADE: 'gmin',
  MAX_GRADE: 'gmax',
  GRADE_SYSTEM: 'gs',
  SEASON: 'sp',
  EXPOSURE: 'ep',
  LIMIT: 'l',
  WEATHER: 'w',
  CROWD: 'cr',
  WALK_TIME: 'wt',
  ASPECT: 'asp',
  FAMILY: 'fam',
  STYLE: 'st',
} as const
