/**
 * Recent Searches Hook
 *
 * React hook for managing recent crag searches with AsyncStorage persistence.
 * Provides state management and actions for the search history.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  type RecentSearch,
} from '@/services/storage/recentSearchesStorage'
import { devLog } from '@/utils/logger'

export interface UseRecentSearchesResult {
  /** List of recent searches, sorted by most recent first */
  recentSearches: RecentSearch[]
  /** Whether the initial load is in progress */
  isLoading: boolean
  /** Add a new search to the history */
  addSearch: (
    query: string,
    cragId?: string,
    cragName?: string,
  ) => Promise<void>
  /** Remove a specific search by ID */
  removeSearch: (searchId: string) => Promise<void>
  /** Clear all search history */
  clearHistory: () => Promise<void>
}

/**
 * Hook for managing recent searches with persistence
 *
 * @returns Object with recent searches state and actions
 */
export function useRecentSearches(): UseRecentSearchesResult {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load recent searches on mount
  useEffect(() => {
    let mounted = true

    async function loadSearches() {
      try {
        const searches = await getRecentSearches()
        if (mounted) {
          setRecentSearches(searches)
          setIsLoading(false)
        }
      } catch (error) {
        devLog.error('Failed to load recent searches', error)
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadSearches()

    return () => {
      mounted = false
    }
  }, [])

  const addSearch = useCallback(
    async (query: string, cragId?: string, cragName?: string) => {
      try {
        const updated = await addRecentSearch(query, cragId, cragName)
        setRecentSearches(updated)
      } catch (error) {
        devLog.error('Failed to add search', error)
      }
    },
    [],
  )

  const removeSearch = useCallback(async (searchId: string) => {
    try {
      const updated = await removeRecentSearch(searchId)
      setRecentSearches(updated)
    } catch (error) {
      devLog.error('Failed to remove search', error)
    }
  }, [])

  const clearHistory = useCallback(async () => {
    try {
      await clearRecentSearches()
      setRecentSearches([])
    } catch (error) {
      devLog.error('Failed to clear history', error)
    }
  }, [])

  return useMemo(
    () => ({
      recentSearches,
      isLoading,
      addSearch,
      removeSearch,
      clearHistory,
    }),
    [recentSearches, isLoading, addSearch, removeSearch, clearHistory],
  )
}
