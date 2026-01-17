import { useQuery } from '@tanstack/react-query'
import { zoneApi } from '@/services/api/zoneApi'
import type { GradingSystem } from '@/types/api'

interface UseZoneOverviewOptions {
  enabled?: boolean
  gradingSystem?: GradingSystem
}

export function useZoneOverview(
  zoneId: string,
  options?: UseZoneOverviewOptions,
) {
  return useQuery({
    queryKey: ['zone-overview', zoneId, options?.gradingSystem],
    queryFn: () => zoneApi.getZoneOverview(zoneId, options?.gradingSystem),
    enabled: options?.enabled !== undefined ? options.enabled : !!zoneId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
