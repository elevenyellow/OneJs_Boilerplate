/**
 * Preferences Context
 *
 * Provides global access to user preferences throughout the app.
 * Handles loading, saving, and reactive updates to preferences.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'
import {
  DEFAULT_PREFERENCES,
  type PartialPreferences,
  type UserPreferences,
} from '@/types/preferences'
import {
  loadPreferences,
  resetPreferences,
  savePreferences,
} from '@/services/storage/preferencesStorage'
import { devLog } from '@/utils/logger'

// =============================================================================
// Context Types
// =============================================================================

interface PreferencesContextValue {
  /**
   * Current user preferences
   */
  preferences: UserPreferences

  /**
   * Whether preferences are currently being loaded
   */
  isLoading: boolean

  /**
   * Whether a save operation is in progress
   */
  isSaving: boolean

  /**
   * Update one or more preferences
   * Automatically persists to storage
   */
  updatePreferences: (updates: PartialPreferences) => Promise<void>

  /**
   * Reset all preferences to defaults
   */
  resetToDefaults: () => Promise<void>

  /**
   * Reload preferences from storage
   */
  reloadPreferences: () => Promise<void>
}

// =============================================================================
// Context Creation
// =============================================================================

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

// =============================================================================
// Provider Component
// =============================================================================

interface PreferencesProviderProps {
  children: ReactNode
}

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const { i18n } = useTranslation()

  const [preferences, setPreferences] =
    useState<UserPreferences>(DEFAULT_PREFERENCES)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // ---------------------------------------------------------------------------
  // Load preferences on mount
  // ---------------------------------------------------------------------------

  const loadStoredPreferences = useCallback(async () => {
    try {
      setIsLoading(true)
      const loaded = await loadPreferences()
      setPreferences(loaded)

      // Sync language with i18n
      if (loaded.language !== i18n.language) {
        await i18n.changeLanguage(loaded.language)
      }

      devLog.log('Preferences loaded successfully')
    } catch (error) {
      devLog.error('Failed to load preferences', error)
      // Keep using defaults on error
    } finally {
      setIsLoading(false)
    }
  }, [i18n])

  useEffect(() => {
    loadStoredPreferences()
  }, [loadStoredPreferences])

  // ---------------------------------------------------------------------------
  // Update preferences
  // ---------------------------------------------------------------------------

  const updatePreferences = useCallback(
    async (updates: PartialPreferences) => {
      try {
        setIsSaving(true)

        // Optimistic update using functional form to ensure latest state
        setPreferences((current) => ({ ...current, ...updates }))

        // Persist to storage - don't overwrite state with result
        // The optimistic update is already correct
        await savePreferences(updates)

        // Handle language change
        if (updates.language && updates.language !== i18n.language) {
          await i18n.changeLanguage(updates.language)
        }

        devLog.log('Preferences updated', { updates })
      } catch (error) {
        // Rollback on error
        devLog.error('Failed to update preferences, rolling back', error)
        const current = await loadPreferences()
        setPreferences(current)
        throw error
      } finally {
        setIsSaving(false)
      }
    },
    [i18n],
  )

  // ---------------------------------------------------------------------------
  // Reset to defaults
  // ---------------------------------------------------------------------------

  const resetToDefaults = useCallback(async () => {
    try {
      setIsSaving(true)
      const defaults = await resetPreferences()
      setPreferences(defaults)

      // Sync language with i18n
      if (defaults.language !== i18n.language) {
        await i18n.changeLanguage(defaults.language)
      }

      devLog.log('Preferences reset to defaults')
    } catch (error) {
      devLog.error('Failed to reset preferences', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }, [i18n])

  // ---------------------------------------------------------------------------
  // Reload from storage
  // ---------------------------------------------------------------------------

  const reloadPreferences = useCallback(async () => {
    await loadStoredPreferences()
  }, [loadStoredPreferences])

  // ---------------------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------------------

  const contextValue = useMemo<PreferencesContextValue>(
    () => ({
      preferences,
      isLoading,
      isSaving,
      updatePreferences,
      resetToDefaults,
      reloadPreferences,
    }),
    [
      preferences,
      isLoading,
      isSaving,
      updatePreferences,
      resetToDefaults,
      reloadPreferences,
    ],
  )

  return (
    <PreferencesContext.Provider value={contextValue}>
      {children}
    </PreferencesContext.Provider>
  )
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Access user preferences and update functions
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { preferences, updatePreferences } = usePreferences()
 *
 *   const handleGradeSystemChange = (system: GradeSystemPreference) => {
 *     updatePreferences({ gradeSystem: system })
 *   }
 *
 *   return <Text>Current system: {preferences.gradeSystem}</Text>
 * }
 * ```
 */
export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext)

  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider')
  }

  return context
}

// =============================================================================
// Specialized Hooks
// =============================================================================

/**
 * Access only the grade system preference
 * Optimized for components that only need grade system info
 */
export function useGradeSystemPreference() {
  const { preferences, updatePreferences } = usePreferences()

  const setGradeSystem = useCallback(
    (gradeSystem: UserPreferences['gradeSystem']) => {
      return updatePreferences({ gradeSystem })
    },
    [updatePreferences],
  )

  return {
    gradeSystem: preferences.gradeSystem,
    setGradeSystem,
    showBoulderGrades: preferences.showBoulderGrades,
    showAidGrades: preferences.showAidGrades,
  }
}

/**
 * Access only unit preferences
 * Optimized for components that only need unit formatting
 */
export function useUnitPreferences() {
  const { preferences, updatePreferences } = usePreferences()

  const setDistanceUnit = useCallback(
    (distanceUnit: UserPreferences['distanceUnit']) => {
      return updatePreferences({ distanceUnit })
    },
    [updatePreferences],
  )

  const setHeightUnit = useCallback(
    (heightUnit: UserPreferences['heightUnit']) => {
      return updatePreferences({ heightUnit })
    },
    [updatePreferences],
  )

  const setTemperatureUnit = useCallback(
    (temperatureUnit: UserPreferences['temperatureUnit']) => {
      return updatePreferences({ temperatureUnit })
    },
    [updatePreferences],
  )

  return {
    distanceUnit: preferences.distanceUnit,
    heightUnit: preferences.heightUnit,
    temperatureUnit: preferences.temperatureUnit,
    setDistanceUnit,
    setHeightUnit,
    setTemperatureUnit,
  }
}

/**
 * Access search default preferences
 */
export function useSearchDefaultPreferences() {
  const { preferences, updatePreferences } = usePreferences()

  const setSearchDefaults = useCallback(
    (
      updates: Pick<
        PartialPreferences,
        | 'defaultSearchRadiusKm'
        | 'defaultMinGrade'
        | 'defaultMaxGrade'
        | 'rememberLastSearch'
      >,
    ) => {
      return updatePreferences(updates)
    },
    [updatePreferences],
  )

  return {
    defaultSearchRadiusKm: preferences.defaultSearchRadiusKm,
    defaultMinGrade: preferences.defaultMinGrade,
    defaultMaxGrade: preferences.defaultMaxGrade,
    rememberLastSearch: preferences.rememberLastSearch,
    setSearchDefaults,
  }
}
