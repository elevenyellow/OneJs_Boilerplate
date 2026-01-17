/**
 * Query parameter parsing utilities for API optimization
 *
 * These parsers support both:
 * - Short param names with numeric codes (preferred)
 * - Legacy string values (backward compatibility)
 *
 * @see docs/api-query-codes.md for full documentation
 */

import {
  GRADE_SYSTEM_FROM_CODE,
  SEASON_FROM_CODE,
  EXPOSURE_FROM_CODE,
  DISTANCE_UNIT_FROM_CODE,
  GradeIndex,
  MILES_TO_KM,
} from '../constants/query-codes'

/**
 * Parse grade system from code or string (backward compatible)
 * @param value - Numeric code (1-6) or string name
 * @param defaultValue - Default grade system
 * @returns Normalized grade system string
 */
export function parseGradeSystem(
  value: string | number | undefined,
  defaultValue = 'french',
): string {
  if (value === undefined || value === '') return defaultValue

  const num = Number(value)
  if (!Number.isNaN(num) && GRADE_SYSTEM_FROM_CODE[num]) {
    return GRADE_SYSTEM_FROM_CODE[num]
  }

  // Backward compatibility: accept string values
  const str = String(value).toLowerCase()
  if (['french', 'yds', 'uiaa', 'british', 'font', 'hueco'].includes(str)) {
    return str
  }

  return defaultValue
}

/**
 * Parse season preference from code or string
 * @param value - Numeric code (0-2) or string name
 * @param defaultValue - Default season preference
 * @returns Normalized season preference string
 */
export function parseSeasonPreference(
  value: string | number | undefined,
  defaultValue = 'any',
): 'any' | 'summer' | 'winter' {
  if (value === undefined || value === '') return defaultValue as 'any'

  const num = Number(value)
  if (!Number.isNaN(num) && SEASON_FROM_CODE[num]) {
    return SEASON_FROM_CODE[num] as 'any' | 'summer' | 'winter'
  }

  // Backward compatibility
  const str = String(value).toLowerCase()
  if (['any', 'summer', 'winter'].includes(str)) {
    return str as 'any' | 'summer' | 'winter'
  }

  return defaultValue as 'any'
}

/**
 * Parse exposure preference (sun/shade) from code or string
 * @param value - Numeric code (0-2) or string name
 * @param defaultValue - Default exposure preference
 * @returns Normalized exposure preference string
 */
export function parseExposurePreference(
  value: string | number | undefined,
  defaultValue = 'any',
): 'any' | 'sun' | 'shade' {
  if (value === undefined || value === '') return defaultValue as 'any'

  const num = Number(value)
  if (!Number.isNaN(num) && EXPOSURE_FROM_CODE[num]) {
    return EXPOSURE_FROM_CODE[num] as 'any' | 'sun' | 'shade'
  }

  // Backward compatibility
  const str = String(value).toLowerCase()
  if (['any', 'sun', 'shade'].includes(str)) {
    return str as 'any' | 'sun' | 'shade'
  }

  return defaultValue as 'any'
}

/**
 * Parse distance unit from code or string
 * @param value - Numeric code (1-2) or string name
 * @param defaultValue - Default distance unit
 * @returns Normalized distance unit string
 */
export function parseDistanceUnit(
  value: string | number | undefined,
  defaultValue = 'km',
): 'km' | 'mi' {
  if (value === undefined || value === '') return defaultValue as 'km'

  const num = Number(value)
  if (!Number.isNaN(num) && DISTANCE_UNIT_FROM_CODE[num]) {
    return DISTANCE_UNIT_FROM_CODE[num] as 'km' | 'mi'
  }

  // Backward compatibility
  const str = String(value).toLowerCase()
  if (['km', 'kilometers'].includes(str)) return 'km'
  if (['mi', 'miles'].includes(str)) return 'mi'

  return defaultValue as 'km'
}

/**
 * Parse radius and convert to kilometers based on unit
 * @param radius - Radius value
 * @param unit - Distance unit code or string
 * @returns Radius in kilometers
 */
export function parseRadiusToKm(
  radius: string | number | undefined,
  unit: string | number | undefined,
): number {
  const radiusValue = parseNumber(radius, 50)
  const distanceUnit = parseDistanceUnit(unit, 'km')

  if (distanceUnit === 'mi') {
    return radiusValue * MILES_TO_KM
  }

  return radiusValue
}

/**
 * Parse grade index (must be number 10-46)
 * @param value - Grade index value
 * @param paramName - Parameter name for error messages
 * @returns Validated grade index
 * @throws Error if value is invalid or out of range
 */
export function parseGradeIndex(
  value: string | number | undefined,
  paramName: string,
): number {
  if (value === undefined || value === '') {
    throw new Error(
      `Missing required parameter: ${paramName}. Must be a grade index (${GradeIndex.MIN}-${GradeIndex.MAX})`,
    )
  }

  const num = Number(value)

  if (Number.isNaN(num)) {
    throw new Error(
      `Invalid ${paramName}: must be a number. Use grade index (e.g., 24 for 6a, 32 for 7b)`,
    )
  }

  if (num < GradeIndex.MIN || num > GradeIndex.MAX) {
    throw new Error(
      `Invalid ${paramName}: out of range. Must be between ${GradeIndex.MIN} and ${GradeIndex.MAX}`,
    )
  }

  return num
}

/**
 * Parse optional grade index with default
 * @param value - Grade index value
 * @param defaultValue - Default grade index
 * @returns Grade index or default
 */
export function parseOptionalGradeIndex(
  value: string | number | undefined,
  defaultValue: number,
): number {
  if (value === undefined || value === '') return defaultValue

  const num = Number(value)
  if (Number.isNaN(num)) return defaultValue
  if (num < GradeIndex.MIN || num > GradeIndex.MAX) return defaultValue

  return num
}

/**
 * Parse numeric value with default
 * @param value - Numeric value
 * @param defaultValue - Default value
 * @returns Parsed number or default
 */
export function parseNumber(
  value: string | number | undefined,
  defaultValue: number,
): number {
  if (value === undefined || value === '') return defaultValue
  const num = Number(value)
  return Number.isNaN(num) ? defaultValue : num
}

/**
 * Parse required numeric value
 * @param value - Numeric value
 * @param paramName - Parameter name for error messages
 * @returns Validated number
 * @throws Error if value is missing or invalid
 */
export function parseRequiredNumber(
  value: string | number | undefined,
  paramName: string,
): number {
  if (value === undefined || value === '') {
    throw new Error(`Missing required parameter: ${paramName}`)
  }

  const num = Number(value)
  if (Number.isNaN(num)) {
    throw new Error(`Invalid ${paramName}: must be a valid number`)
  }

  return num
}

/**
 * Parse latitude with validation
 * @param value - Latitude value
 * @returns Validated latitude
 * @throws Error if invalid
 */
export function parseLatitude(value: string | number | undefined): number {
  const lat = parseRequiredNumber(value, 'latitude')

  if (lat < -90 || lat > 90) {
    throw new Error('Invalid latitude: must be between -90 and 90')
  }

  return lat
}

/**
 * Parse longitude with validation
 * @param value - Longitude value
 * @returns Validated longitude
 * @throws Error if invalid
 */
export function parseLongitude(value: string | number | undefined): number {
  const lng = parseRequiredNumber(value, 'longitude')

  if (lng < -180 || lng > 180) {
    throw new Error('Invalid longitude: must be between -180 and 180')
  }

  return lng
}

/**
 * Parse enum code with mapping
 * @param value - Numeric code or string
 * @param codeMap - Map of code to value
 * @param defaultValue - Default value
 * @returns Mapped value or default
 */
export function parseEnumCode<T extends string>(
  value: string | number | undefined,
  codeMap: Record<number, string>,
  defaultValue: T,
): T {
  if (value === undefined || value === '') return defaultValue

  const num = Number(value)
  if (!Number.isNaN(num) && codeMap[num]) {
    return codeMap[num] as T
  }

  return defaultValue
}
