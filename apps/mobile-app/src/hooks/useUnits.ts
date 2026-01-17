/**
 * useUnits Hook
 *
 * Provides unit formatting utilities based on user preferences.
 * Use this hook to format distances, heights, and temperatures
 * according to user's preferred units.
 */

import { useMemo, useCallback } from 'react'
import { useUnitPreferences } from '@/contexts/PreferencesContext'
import type {
  DistanceUnit,
  HeightUnit,
  TemperatureUnit,
} from '@/types/preferences'

// =============================================================================
// Conversion Constants
// =============================================================================

const KM_TO_MILES = 0.621371
const METERS_TO_FEET = 3.28084

// =============================================================================
// Types
// =============================================================================

interface UseUnitsResult {
  /**
   * Current distance unit preference
   */
  distanceUnit: DistanceUnit

  /**
   * Current height unit preference
   */
  heightUnit: HeightUnit

  /**
   * Current temperature unit preference
   */
  temperatureUnit: TemperatureUnit

  /**
   * Format a distance value (in km) to user's preferred unit
   * @param km - Distance in kilometers
   * @param options - Formatting options
   */
  formatDistance: (
    km: number,
    options?: { decimals?: number; includeUnit?: boolean },
  ) => string

  /**
   * Format a height value (in meters) to user's preferred unit
   * @param meters - Height in meters
   * @param options - Formatting options
   */
  formatHeight: (
    meters: number,
    options?: { decimals?: number; includeUnit?: boolean },
  ) => string

  /**
   * Format a temperature value (in Celsius) to user's preferred unit
   * @param celsius - Temperature in Celsius
   * @param options - Formatting options
   */
  formatTemperature: (
    celsius: number,
    options?: { decimals?: number; includeUnit?: boolean },
  ) => string

  /**
   * Get the short label for the current distance unit
   */
  distanceUnitLabel: string

  /**
   * Get the short label for the current height unit
   */
  heightUnitLabel: string

  /**
   * Get the symbol for the current temperature unit
   */
  temperatureUnitSymbol: string

  /**
   * Convert km to the user's preferred distance unit (raw number)
   */
  convertDistance: (km: number) => number

  /**
   * Convert meters to the user's preferred height unit (raw number)
   */
  convertHeight: (meters: number) => number

  /**
   * Convert Celsius to the user's preferred temperature unit (raw number)
   */
  convertTemperature: (celsius: number) => number
}

// =============================================================================
// Hook
// =============================================================================

export function useUnits(): UseUnitsResult {
  const { distanceUnit, heightUnit, temperatureUnit } = useUnitPreferences()

  // ---------------------------------------------------------------------------
  // Unit Labels
  // ---------------------------------------------------------------------------

  const distanceUnitLabel = useMemo(
    () => (distanceUnit === 'metric' ? 'km' : 'mi'),
    [distanceUnit],
  )

  const heightUnitLabel = useMemo(
    () => (heightUnit === 'meters' ? 'm' : 'ft'),
    [heightUnit],
  )

  const temperatureUnitSymbol = useMemo(
    () => (temperatureUnit === 'celsius' ? '°C' : '°F'),
    [temperatureUnit],
  )

  // ---------------------------------------------------------------------------
  // Conversion Functions
  // ---------------------------------------------------------------------------

  const convertDistance = useCallback(
    (km: number): number => {
      if (distanceUnit === 'imperial') {
        return km * KM_TO_MILES
      }
      return km
    },
    [distanceUnit],
  )

  const convertHeight = useCallback(
    (meters: number): number => {
      if (heightUnit === 'feet') {
        return meters * METERS_TO_FEET
      }
      return meters
    },
    [heightUnit],
  )

  const convertTemperature = useCallback(
    (celsius: number): number => {
      if (temperatureUnit === 'fahrenheit') {
        return (celsius * 9) / 5 + 32
      }
      return celsius
    },
    [temperatureUnit],
  )

  // ---------------------------------------------------------------------------
  // Formatting Functions
  // ---------------------------------------------------------------------------

  const formatDistance = useCallback(
    (
      km: number,
      options: { decimals?: number; includeUnit?: boolean } = {},
    ): string => {
      const { decimals = 1, includeUnit = true } = options
      const converted = convertDistance(km)
      const formatted = converted.toFixed(decimals)
      return includeUnit ? `${formatted} ${distanceUnitLabel}` : formatted
    },
    [convertDistance, distanceUnitLabel],
  )

  const formatHeight = useCallback(
    (
      meters: number,
      options: { decimals?: number; includeUnit?: boolean } = {},
    ): string => {
      const { decimals = 0, includeUnit = true } = options
      const converted = convertHeight(meters)
      const formatted = converted.toFixed(decimals)
      return includeUnit ? `${formatted} ${heightUnitLabel}` : formatted
    },
    [convertHeight, heightUnitLabel],
  )

  const formatTemperature = useCallback(
    (
      celsius: number,
      options: { decimals?: number; includeUnit?: boolean } = {},
    ): string => {
      const { decimals = 0, includeUnit = true } = options
      const converted = convertTemperature(celsius)
      const formatted = converted.toFixed(decimals)
      return includeUnit ? `${formatted}${temperatureUnitSymbol}` : formatted
    },
    [convertTemperature, temperatureUnitSymbol],
  )

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    distanceUnit,
    heightUnit,
    temperatureUnit,
    formatDistance,
    formatHeight,
    formatTemperature,
    distanceUnitLabel,
    heightUnitLabel,
    temperatureUnitSymbol,
    convertDistance,
    convertHeight,
    convertTemperature,
  }
}
