import { api, type SearchSectorsDto } from '@/lib/api'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'

const PAGE_SIZE = 10

export function useSectorSearch(
  filters: SearchSectorsDto | null,
  enabled = true,
) {
  const queryClient = useQueryClient()
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

        // 🚀 PREFETCHING: Pre-cargar datos de los sectores más relevantes
        if (pageParam === 0 && result.results.length > 0) {
          // Obtener top 3 sectores más relevantes
          const topSectors = result.results
            .flatMap(crag => crag.sectors)
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 3)

          console.log('[useSectorSearch] Prefetching data for top 3 sectors')

          // Pre-cargar rutas de cada sector en paralelo
          topSectors.forEach(sectorResult => {
            const sector = sectorResult.sector

            // Prefetch routes
            queryClient.prefetchQuery({
              queryKey: ['sectors', sector.id, 'routes'],
              queryFn: () => api.sectors.getRoutes(sector.id, { limit: 100 }),
              staleTime: 10 * 60 * 1000, // 10 minutos
            })

            // Prefetch weather si tiene coordenadas
            if (sector.coordinates?.lat && sector.coordinates?.lon) {
              queryClient.prefetchQuery({
                queryKey: ['weather', 'coordinates', sector.coordinates.lat, sector.coordinates.lon],
                queryFn: () => api.weather.getByCoordinates(
                  sector.coordinates.lat,
                  sector.coordinates.lon
                ),
                staleTime: 15 * 60 * 1000, // 15 minutos
              })
            }
          })
        }

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
    gradeRange?: { min: string; max: string }
  },
  enabled = true,
) {
  const isEnabled = enabled && !!zoneCoordinates?.latitude && !!zoneCoordinates?.longitude

  // Use provided grade range or fallback to wide range
  const gradeRange = options?.gradeRange?.min && options?.gradeRange?.max
    ? options.gradeRange
    : { min: '4a', max: '9a' }

  const filters: SearchSectorsDto | null = zoneCoordinates
    ? {
        userLocation: {
          lat: zoneCoordinates.latitude,
          lon: zoneCoordinates.longitude,
        },
        gradeRange,
        maxDistance: options?.maxDistance ?? 30, // 30km radius around the zone
        limit: options?.limit ?? 10,
      }
    : null

  return useQuery({
    queryKey: ['zones', 'sectors', zoneCoordinates, options, gradeRange],
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
