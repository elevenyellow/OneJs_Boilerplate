import { api, type RouteSearchInfo } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

interface SectorRoutesResponse {
  sectorId: string
  total: number
  routes: RouteSearchInfo[]
}

export function useSectorRoutes(
  sectorId: string,
  options?: { minStars?: number; limit?: number },
  enabled = true
) {
  return useQuery<SectorRoutesResponse>({
    queryKey: ['sector-routes', sectorId, options],
    queryFn: () => api.sectors.getRoutes(sectorId, options),
    enabled: enabled && !!sectorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
