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
