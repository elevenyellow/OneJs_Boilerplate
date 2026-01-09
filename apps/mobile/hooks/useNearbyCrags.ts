import { api, type NearbyCragsFilters, type NearbyCragsResponse } from '@/lib/api'
import { useInfiniteQuery } from '@tanstack/react-query'

const PAGE_SIZE = 30

export function useNearbyCrags(
  filters: Omit<NearbyCragsFilters, 'offset' | 'limit'> | null,
  enabled = true,
) {
  const isEnabled = enabled && filters !== null && !!filters.lat && !!filters.lon

  return useInfiniteQuery({
    queryKey: ['crags', 'nearby', filters],
    queryFn: async ({ pageParam = 0 }) => {
      if (!filters) throw new Error('Filters required')
      
      const result = await api.crags.getNearby({
        ...filters,
        limit: PAGE_SIZE,
        offset: pageParam,
      })
      
      return result
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: NearbyCragsResponse, allPages) => {
      if (!lastPage.pagination.hasMore) return undefined
      return allPages.length * PAGE_SIZE
    },
    enabled: isEnabled,
    staleTime: 10 * 60 * 1000, // 10 minutes - list doesn't change often
  })
}
