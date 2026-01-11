import { api, type RouteDetail } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

export function useRouteDetail(routeId: string, enabled = true) {
  return useQuery<RouteDetail>({
    queryKey: ['route-detail', routeId],
    queryFn: () => api.routes.getById(routeId),
    enabled: enabled && !!routeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
