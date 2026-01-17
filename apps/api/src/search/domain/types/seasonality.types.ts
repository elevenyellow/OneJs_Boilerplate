/**
 * Seasonality types for search criteria
 */

export enum SeasonPreference {
  SUMMER = 'summer',
  WINTER = 'winter',
  ANY = 'any',
}

/**
 * Mapping of season preferences to months (1-12)
 */
export const SEASON_PREFERENCE_MONTHS: Record<SeasonPreference, number[]> = {
  [SeasonPreference.SUMMER]: [6, 7, 8, 9], // June, July, August, September
  [SeasonPreference.WINTER]: [12, 1, 2, 3], // December, January, February, March
  [SeasonPreference.ANY]: [], // All months are valid
}

/**
 * Check if a crag's good months are compatible with a season preference
 * @param cragMonths - Array of good months for the crag (1-12)
 * @param preference - Season preference to check
 * @returns True if compatible, false otherwise
 */
export function isSeasonCompatible(
  cragMonths: number[],
  preference: SeasonPreference,
): boolean {
  // ANY preference is always compatible
  if (preference === SeasonPreference.ANY) {
    return true
  }

  const preferredMonths = SEASON_PREFERENCE_MONTHS[preference]

  // If crag has no months defined, it's not compatible with specific seasons
  if (cragMonths.length === 0) {
    return false
  }

  // Check if there's at least one month in common
  return cragMonths.some((month) => preferredMonths.includes(month))
}

/**
 * Parse season preference from numeric code (API query parameter)
 * @param code - Numeric code: 1=summer, 2=winter, 0/undefined=any
 * @returns SeasonPreference enum value
 */
export function parseSeasonPreferenceFromCode(
  code: number | undefined,
): SeasonPreference {
  if (code === undefined || Number.isNaN(code)) {
    return SeasonPreference.ANY
  }

  switch (code) {
    case 1:
      return SeasonPreference.SUMMER
    case 2:
      return SeasonPreference.WINTER
    default:
      return SeasonPreference.ANY
  }
}

/**
 * Exposure preference type for search criteria
 */
export type ExposurePreference = 'sun' | 'shade' | 'any'

/**
 * Mapping of exposure preferences to months (1-12)
 *
 * Logic:
 * - Sunny sectors are optimal in WINTER (when you want warmth from sun)
 *   → Look for sectors with good climbing months in Nov-Mar (11,12,1,2,3)
 * - Shaded sectors are optimal in SUMMER (when you want to avoid sun/heat)
 *   → Look for sectors with good climbing months in May-Sep (5,6,7,8,9)
 */
export const EXPOSURE_PREFERENCE_MONTHS: Record<
  Exclude<ExposurePreference, 'any'>,
  number[]
> = {
  sun: [11, 12, 1, 2, 3], // Winter months - sunny sectors are good for winter climbing
  shade: [5, 6, 7, 8, 9], // Summer months - shaded sectors are good for summer climbing
}

/**
 * Check if a crag's good months are compatible with an exposure preference
 *
 * IMPORTANT: This is the SINGLE SOURCE OF TRUTH for exposure matching logic.
 * Do NOT duplicate this logic elsewhere.
 *
 * @param goodMonths - Array of month numbers (1-12) when climbing is good.
 *                     Use Seasonality.getGoodMonths(), NOT getMonths()
 * @param preference - Exposure preference: 'sun', 'shade', or 'any'
 * @returns True if compatible, false otherwise
 *
 * @example
 * // Altura has goodMonths = [1, 2, 3, 11, 12] (winter months)
 * isExposureCompatible([1, 2, 3, 11, 12], 'sun')   // true - sunny sector, good in winter
 * isExposureCompatible([1, 2, 3, 11, 12], 'shade') // false - not a shaded sector
 * isExposureCompatible([5, 6, 7, 8, 9], 'shade')   // true - shaded sector, good in summer
 */
export function isExposureCompatible(
  goodMonths: number[],
  preference: ExposurePreference,
): boolean {
  // 'any' preference always matches
  if (preference === 'any') {
    return true
  }

  // If no good months defined, not compatible with specific preferences
  if (goodMonths.length === 0) {
    return false
  }

  const targetMonths = EXPOSURE_PREFERENCE_MONTHS[preference]

  // Check if there's at least one good month in the target range
  return goodMonths.some((month) => targetMonths.includes(month))
}

/**
 * Parse exposure preference from numeric code (API query parameter)
 * @param code - Numeric code: 1=sun, 2=shade, 0/undefined=any
 * @returns ExposurePreference value
 */
export function parseExposurePreferenceFromCode(
  code: number | undefined,
): ExposurePreference {
  if (code === undefined || Number.isNaN(code)) {
    return 'any'
  }

  switch (code) {
    case 1:
      return 'sun'
    case 2:
      return 'shade'
    default:
      return 'any'
  }
}
