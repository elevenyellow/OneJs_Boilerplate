import { api, type SearchSectorsDto } from '@/lib/api'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

const PAGE_SIZE = 10

export function useSectorSearch(
  filters: SearchSectorsDto | null,
  enabled = true,
) {
  const isEnabled = enabled && !!filters?.userLocation && !!filters?.gradeRange

  return useInfiniteQuery({
    queryKey: ['sectors', 'search', filters],
    queryFn: async ({ pageParam = 0 }) => {
      if (!filters) throw new Error('Filters required')
      try {
        const result = await api.sectors.search({
          ...filters,
          limit: PAGE_SIZE,
          offset: pageParam,
        })
        console.log(
          '[useSectorSearch] Results:',
          result?.results?.length ?? 0,
          'crags,',
          result?.totalSectors ?? 0,
          'sectors, offset:',
          pageParam,
        )
        return result
      } catch (error) {
        console.error('[useSectorSearch] Error:', error)
        throw error
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loadedItems = allPages.reduce((sum, page) => sum + page.results.length, 0)
      if (loadedItems >= lastPage.total) {
        return undefined // No more pages
      }
      return loadedItems // Next offset
    },
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Search for sectors near a specific zone's coordinates
 * Uses the zone's location as the search center with a small radius
 */
export function useZoneSectors(
  zoneCoordinates: { latitude: number; longitude: number } | null,
  options?: {
    maxDistance?: number
    limit?: number
  },
  enabled = true,
) {
  const isEnabled = enabled && !!zoneCoordinates?.latitude && !!zoneCoordinates?.longitude

  const filters: SearchSectorsDto | null = zoneCoordinates
    ? {
        userLocation: {
          lat: zoneCoordinates.latitude,
          lon: zoneCoordinates.longitude,
        },
        // Use a wide grade range to get all sectors
        gradeRange: { min: '4a', max: '9a' },
        maxDistance: options?.maxDistance ?? 30, // 30km radius around the zone
        limit: options?.limit ?? 10,
      }
    : null

  return useQuery({
    queryKey: ['zones', 'sectors', zoneCoordinates, options],
    queryFn: async () => {
      if (!filters) throw new Error('Zone coordinates required')
      try {
        const result = await api.sectors.search(filters)
        return result
      } catch (error) {
        console.error('[useZoneSectors] Error:', error)
        throw error
      }
    },
    enabled: isEnabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
