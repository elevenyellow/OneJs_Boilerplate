import type { SearchSectorsDto } from '@/lib/api'
import AsyncStorage from '@react-native-async-storage/async-storage'

const FILTER_STORAGE_KEY = '@climb_zone:filters'
const LOCATION_STORAGE_KEY = '@climb_zone:last_location'

/**
 * Partial filter state for persistence
 */
export interface StoredFilters {
  maxDistance?: number
  gradeRange?: { min: string; max: string }
  forceOrientation?: 'sun' | 'shade' | 'any'
  minRoutes?: number
  rockTypes?: string[]
  climbingStyles?: string[]
  hasTopo?: boolean
  requiresNoPermit?: boolean
}

/**
 * Save filters to storage
 */
export async function saveFilters(filters: StoredFilters): Promise<void> {
  try {
    const json = JSON.stringify(filters)
    await AsyncStorage.setItem(FILTER_STORAGE_KEY, json)
  } catch (error) {
    console.error('Error saving filters:', error)
  }
}

/**
 * Load filters from storage
 */
export async function loadFilters(): Promise<StoredFilters | null> {
  try {
    const json = await AsyncStorage.getItem(FILTER_STORAGE_KEY)
    if (!json) return null
    const filters = JSON.parse(json)

    // Clean up filters that don't work with current data
    // rockTypes is not populated in the database yet
    if (filters.rockTypes) {
      delete filters.rockTypes
    }

    return filters
  } catch (error) {
    console.error('Error loading filters:', error)
    return null
  }
}

/**
 * Clear stored filters
 */
export async function clearFilters(): Promise<void> {
  try {
    await AsyncStorage.removeItem(FILTER_STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing filters:', error)
  }
}

/**
 * Save last known location
 */
export async function saveLocation(location: {
  lat: number
  lon: number
  name?: string
}): Promise<void> {
  try {
    const json = JSON.stringify(location)
    await AsyncStorage.setItem(LOCATION_STORAGE_KEY, json)
  } catch (error) {
    console.error('Error saving location:', error)
  }
}

/**
 * Load last known location
 */
export async function loadLocation(): Promise<{
  lat: number
  lon: number
  name?: string
} | null> {
  try {
    const json = await AsyncStorage.getItem(LOCATION_STORAGE_KEY)
    if (!json) return null
    return JSON.parse(json)
  } catch (error) {
    console.error('Error loading location:', error)
    return null
  }
}

/**
 * Get default filters with smart defaults
 */
export function getDefaultFilters(userLocation: {
  lat: number
  lon: number
}): SearchSectorsDto {
  return {
    userLocation,
    // No maxDistance by default - show all zones ordered by score
    gradeRange: { min: '5c', max: '6c' }, // Intermediate level
    limit: 10,
    offset: 0,
  }
}

/**
 * Merge stored filters with defaults
 */
export async function getMergedFilters(userLocation: {
  lat: number
  lon: number
}): Promise<SearchSectorsDto> {
  const defaultFilters = getDefaultFilters(userLocation)
  const storedFilters = await loadFilters()

  if (!storedFilters) return defaultFilters

  return {
    ...defaultFilters,
    ...storedFilters,
    userLocation, // Always use current location
  }
}
