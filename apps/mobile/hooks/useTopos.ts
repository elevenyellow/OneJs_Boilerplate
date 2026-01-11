import { useQuery } from '@tanstack/react-query'
import { api, type TopoImage } from '@/lib/api'

/**
 * Hook to fetch topos for a sector
 */
export function useSectorTopos(sectorId: string, enabled = true) {
  return useQuery<{ sectorId: string; topos: TopoImage[] }>({
    queryKey: ['sector-topos', sectorId],
    queryFn: () => api.sectors.getTopos(sectorId),
    enabled: enabled && !!sectorId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  })
}

/**
 * Hook to fetch topos that contain a specific route
 */
export function useRouteTopos(routeId: string, enabled = true) {
  return useQuery<{ routeId: string; topos: TopoImage[] }>({
    queryKey: ['route-topos', routeId],
    queryFn: () => api.topos.getByRouteId(routeId),
    enabled: enabled && !!routeId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  })
}
