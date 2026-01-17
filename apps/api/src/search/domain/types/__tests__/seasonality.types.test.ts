import { describe, expect, test } from 'bun:test'
import {
  EXPOSURE_PREFERENCE_MONTHS,
  SEASON_PREFERENCE_MONTHS,
  SeasonPreference,
  isExposureCompatible,
  isSeasonCompatible,
} from '../seasonality.types'

describe('Seasonality Types', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ SeasonPreference enum has correct values
  // 2. ✓ SEASON_PREFERENCE_MONTHS maps summer correctly to months [6,7,8,9]
  // 3. ✓ SEASON_PREFERENCE_MONTHS maps winter correctly to months [12,1,2,3]
  // 4. ✓ SEASON_PREFERENCE_MONTHS maps any to empty array (all months valid)
  // 5. ✓ isSeasonCompatible returns true when crag has at least one month in season
  // 6. ✓ isSeasonCompatible returns false when crag has no months in season
  // 7. ✓ isSeasonCompatible returns true for 'any' preference regardless of crag months

  test('should have correct SeasonPreference enum values', () => {
    expect(SeasonPreference.SUMMER).toBe('summer')
    expect(SeasonPreference.WINTER).toBe('winter')
    expect(SeasonPreference.ANY).toBe('any')
  })

  test('should map summer to correct months [6,7,8,9]', () => {
    const summerMonths = SEASON_PREFERENCE_MONTHS[SeasonPreference.SUMMER]
    expect(summerMonths).toEqual([6, 7, 8, 9])
  })

  test('should map winter to correct months [12,1,2,3]', () => {
    const winterMonths = SEASON_PREFERENCE_MONTHS[SeasonPreference.WINTER]
    expect(winterMonths).toEqual([12, 1, 2, 3])
  })

  test('should map any to empty array', () => {
    const anyMonths = SEASON_PREFERENCE_MONTHS[SeasonPreference.ANY]
    expect(anyMonths).toEqual([])
  })

  test('should return true when crag has at least one month in season', () => {
    const cragMonths = [6, 7, 8] // Summer months
    expect(isSeasonCompatible(cragMonths, SeasonPreference.SUMMER)).toBe(true)
  })

  test('should return true when crag has partial overlap with season', () => {
    const cragMonths = [5, 6, 7] // May, June, July
    expect(isSeasonCompatible(cragMonths, SeasonPreference.SUMMER)).toBe(true)
  })

  test('should return false when crag has no months in season', () => {
    const cragMonths = [12, 1, 2] // Winter months
    expect(isSeasonCompatible(cragMonths, SeasonPreference.SUMMER)).toBe(false)
  })

  test('should return true for ANY preference regardless of crag months', () => {
    const cragMonths = [1, 2, 3]
    expect(isSeasonCompatible(cragMonths, SeasonPreference.ANY)).toBe(true)
  })

  test('should return true for ANY preference with empty crag months', () => {
    const cragMonths: number[] = []
    expect(isSeasonCompatible(cragMonths, SeasonPreference.ANY)).toBe(true)
  })

  test('should return false when crag has no months defined and preference is not ANY', () => {
    const cragMonths: number[] = []
    expect(isSeasonCompatible(cragMonths, SeasonPreference.SUMMER)).toBe(false)
  })
})

describe('Exposure Types', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ EXPOSURE_PREFERENCE_MONTHS maps sun to winter months [11,12,1,2,3]
  // 2. ✓ EXPOSURE_PREFERENCE_MONTHS maps shade to summer months [5,6,7,8,9]
  // 3. ✓ isExposureCompatible returns true for 'any' preference
  // 4. ✓ isExposureCompatible returns true for 'sun' when crag has winter months
  // 5. ✓ isExposureCompatible returns false for 'sun' when crag only has summer months
  // 6. ✓ isExposureCompatible returns true for 'shade' when crag has summer months
  // 7. ✓ isExposureCompatible returns false for 'shade' when crag only has winter months
  // 8. ✓ isExposureCompatible returns false when crag has no months and preference is not 'any'
  // 9. ✓ Real-world example: Altura sector (winter/sun sector)

  test('should map sun to winter months [11,12,1,2,3]', () => {
    const sunMonths = EXPOSURE_PREFERENCE_MONTHS.sun
    expect(sunMonths).toEqual([11, 12, 1, 2, 3])
  })

  test('should map shade to summer months [5,6,7,8,9]', () => {
    const shadeMonths = EXPOSURE_PREFERENCE_MONTHS.shade
    expect(shadeMonths).toEqual([5, 6, 7, 8, 9])
  })

  test('should return true for any preference regardless of crag months', () => {
    expect(isExposureCompatible([1, 2, 3], 'any')).toBe(true)
    expect(isExposureCompatible([6, 7, 8], 'any')).toBe(true)
    expect(isExposureCompatible([], 'any')).toBe(true)
  })

  test('should return true for sun preference when crag has winter months', () => {
    // Crag good in winter months (Nov-Mar)
    expect(isExposureCompatible([11, 12, 1, 2, 3], 'sun')).toBe(true)
    expect(isExposureCompatible([1, 2], 'sun')).toBe(true) // Partial overlap
    expect(isExposureCompatible([12], 'sun')).toBe(true) // Single winter month
  })

  test('should return false for sun preference when crag only has summer months', () => {
    // Crag good only in summer months (May-Sep)
    expect(isExposureCompatible([5, 6, 7, 8, 9], 'sun')).toBe(false)
    expect(isExposureCompatible([6, 7, 8], 'sun')).toBe(false)
  })

  test('should return true for shade preference when crag has summer months', () => {
    // Crag good in summer months (May-Sep)
    expect(isExposureCompatible([5, 6, 7, 8, 9], 'shade')).toBe(true)
    expect(isExposureCompatible([6, 7], 'shade')).toBe(true) // Partial overlap
    expect(isExposureCompatible([9], 'shade')).toBe(true) // Single summer month
  })

  test('should return false for shade preference when crag only has winter months', () => {
    // Crag good only in winter months (Nov-Mar)
    expect(isExposureCompatible([11, 12, 1, 2, 3], 'shade')).toBe(false)
    expect(isExposureCompatible([1, 2, 12], 'shade')).toBe(false)
  })

  test('should return false when crag has no months and preference is not any', () => {
    expect(isExposureCompatible([], 'sun')).toBe(false)
    expect(isExposureCompatible([], 'shade')).toBe(false)
  })

  test('should correctly identify Altura as sun sector (real-world example)', () => {
    // Altura, Margalef - winter sector with sun exposure
    // Good months: January, February, March, November, December
    const alturaGoodMonths = [1, 2, 3, 11, 12]

    // Should match 'sun' preference (sunny sectors are good in winter)
    expect(isExposureCompatible(alturaGoodMonths, 'sun')).toBe(true)

    // Should NOT match 'shade' preference (shaded sectors are good in summer)
    expect(isExposureCompatible(alturaGoodMonths, 'shade')).toBe(false)

    // Should always match 'any'
    expect(isExposureCompatible(alturaGoodMonths, 'any')).toBe(true)
  })

  test('should correctly identify summer sectors as shade sectors', () => {
    // Example: A north-facing sector good for summer climbing
    // Good months: May, June, July, August, September
    const summerSectorGoodMonths = [5, 6, 7, 8, 9]

    // Should NOT match 'sun' preference
    expect(isExposureCompatible(summerSectorGoodMonths, 'sun')).toBe(false)

    // Should match 'shade' preference
    expect(isExposureCompatible(summerSectorGoodMonths, 'shade')).toBe(true)
  })

  test('should handle year-round crags correctly', () => {
    // Crag good all year
    const yearRoundGoodMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

    // Should match both preferences (has months in both ranges)
    expect(isExposureCompatible(yearRoundGoodMonths, 'sun')).toBe(true)
    expect(isExposureCompatible(yearRoundGoodMonths, 'shade')).toBe(true)
  })
})
