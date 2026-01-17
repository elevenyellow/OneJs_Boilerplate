/**
 * useSearchDefaults Hook
 *
 * Provides search default preferences for initializing search parameters.
 * Use this hook to get and set default search radius, grade filters, etc.
 */

import { useMemo } from 'react'
import { useSearchDefaultPreferences } from '@/contexts/PreferencesContext'

interface SearchDefaults {
  /**
   * Default search radius in kilometers
   */
  radiusKm: number

  /**
   * Default minimum grade filter (universal grade index)
   */
  minGrade: number | null

  /**
   * Default maximum grade filter (universal grade index)
   */
  maxGrade: number | null

  /**
   * Whether to remember and restore last search
   */
  rememberLastSearch: boolean
}

interface UseSearchDefaultsResult {
  /**
   * Current search default preferences
   */
  defaults: SearchDefaults

  /**
   * Update search default preferences
   */
  setDefaults: (updates: Partial<SearchDefaults>) => Promise<void>

  /**
   * Reset search defaults to system defaults
   */
  resetDefaults: () => Promise<void>
}

export function useSearchDefaults(): UseSearchDefaultsResult {
  const {
    defaultSearchRadiusKm,
    defaultMinGrade,
    defaultMaxGrade,
    rememberLastSearch,
    setSearchDefaults,
  } = useSearchDefaultPreferences()

  const defaults = useMemo<SearchDefaults>(
    () => ({
      radiusKm: defaultSearchRadiusKm,
      minGrade: defaultMinGrade,
      maxGrade: defaultMaxGrade,
      rememberLastSearch,
    }),
    [
      defaultSearchRadiusKm,
      defaultMinGrade,
      defaultMaxGrade,
      rememberLastSearch,
    ],
  )

  const setDefaults = async (updates: Partial<SearchDefaults>) => {
    await setSearchDefaults({
      defaultSearchRadiusKm: updates.radiusKm,
      defaultMinGrade: updates.minGrade,
      defaultMaxGrade: updates.maxGrade,
      rememberLastSearch: updates.rememberLastSearch,
    })
  }

  const resetDefaults = async () => {
    await setSearchDefaults({
      defaultSearchRadiusKm: 50,
      defaultMinGrade: null,
      defaultMaxGrade: null,
      rememberLastSearch: true,
    })
  }

  return {
    defaults,
    setDefaults,
    resetDefaults,
  }
}
