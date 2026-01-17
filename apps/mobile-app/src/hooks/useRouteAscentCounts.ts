/**
 * useRouteAscentCounts Hook
 *
 * Fetches user ascents and creates a map of routeId -> ascent count.
 * Reuses the same query key as useUserPerformance to share cache.
 */

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getUserAscents } from '@/services/api/ascents'

export interface UseRouteAscentCountsResult {
  /** Map of routeId -> number of times climbed */
  ascentCounts: Map<string, number>
  isLoading: boolean
  isError: boolean
  error: Error | null
}

/**
 * Hook that provides a map of route IDs to their ascent counts.
 * Reuses the 'user-ascents' query key to share cache with useUserPerformance.
 */
export function useRouteAscentCounts(): UseRouteAscentCountsResult {
  const {
    data: ascentsResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['user-ascents'],
    queryFn: getUserAscents,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const ascentCounts = useMemo(() => {
    const counts = new Map<string, number>()

    if (!ascentsResponse?.ascents) {
      return counts
    }

    // Count ascents per route
    for (const ascent of ascentsResponse.ascents) {
      const currentCount = counts.get(ascent.routeId) || 0
      counts.set(ascent.routeId, currentCount + 1)
    }

    return counts
  }, [ascentsResponse])

  return {
    ascentCounts,
    isLoading,
    isError,
    error: error as Error | null,
  }
}
