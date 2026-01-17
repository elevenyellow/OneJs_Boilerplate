/**
 * Recent Searches Storage Service
 *
 * Provides AsyncStorage wrapper for storing and managing recent crag searches.
 * Stores up to MAX_RECENT_SEARCHES items with automatic cleanup of oldest entries.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { devLog } from '@/utils/logger'

// =============================================================================
// Constants
// =============================================================================

const STORAGE_KEY = '@climb_app_recent_searches'
const MAX_RECENT_SEARCHES = 10

// =============================================================================
// Types
// =============================================================================

export interface RecentSearch {
  /** Unique identifier for the search entry */
  id: string
  /** The search query text */
  query: string
  /** Optional crag ID if user selected a specific crag */
  cragId?: string
  /** Optional crag name for display */
  cragName?: string
  /** Timestamp when the search was performed */
  timestamp: number
}

interface StoredRecentSearches {
  version: number
  searches: RecentSearch[]
}

// =============================================================================
// Storage Service
// =============================================================================

/**
 * Generate a unique ID for a search entry
 */
function generateSearchId(): string {
  return `search_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Get all recent searches from storage
 * Returns an empty array if no searches are stored
 */
export async function getRecentSearches(): Promise<RecentSearch[]> {
  try {
    const storedJson = await AsyncStorage.getItem(STORAGE_KEY)

    if (!storedJson) {
      return []
    }

    const stored: StoredRecentSearches = JSON.parse(storedJson)
    return stored.searches ?? []
  } catch (error) {
    devLog.error('Failed to get recent searches', error)
    return []
  }
}

/**
 * Add a new search to the recent searches list
 * Automatically removes duplicates and maintains the max limit
 *
 * @param query - The search query text
 * @param cragId - Optional crag ID if user selected a specific result
 * @param cragName - Optional crag name for display
 */
export async function addRecentSearch(
  query: string,
  cragId?: string,
  cragName?: string,
): Promise<RecentSearch[]> {
  try {
    const trimmedQuery = query.trim()

    // Don't save empty queries
    if (!trimmedQuery) {
      return await getRecentSearches()
    }

    const current = await getRecentSearches()

    // Remove duplicates (same query or same cragId)
    const filtered = current.filter((search) => {
      if (cragId && search.cragId === cragId) return false
      if (!cragId && search.query.toLowerCase() === trimmedQuery.toLowerCase())
        return false
      return true
    })

    // Create new search entry
    const newSearch: RecentSearch = {
      id: generateSearchId(),
      query: trimmedQuery,
      cragId,
      cragName,
      timestamp: Date.now(),
    }

    // Add new search at the beginning and limit to max
    const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES)

    // Persist to storage
    const stored: StoredRecentSearches = {
      version: 1,
      searches: updated,
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    devLog.log('Recent search added:', trimmedQuery)

    return updated
  } catch (error) {
    devLog.error('Failed to add recent search', error)
    throw error
  }
}

/**
 * Remove a specific search entry by ID
 *
 * @param searchId - The ID of the search to remove
 */
export async function removeRecentSearch(
  searchId: string,
): Promise<RecentSearch[]> {
  try {
    const current = await getRecentSearches()
    const updated = current.filter((search) => search.id !== searchId)

    const stored: StoredRecentSearches = {
      version: 1,
      searches: updated,
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    devLog.log('Recent search removed:', searchId)

    return updated
  } catch (error) {
    devLog.error('Failed to remove recent search', error)
    throw error
  }
}

/**
 * Clear all recent searches
 */
export async function clearRecentSearches(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY)
    devLog.log('Recent searches cleared')
  } catch (error) {
    devLog.error('Failed to clear recent searches', error)
    throw error
  }
}
