import { api, type CragDetail } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

export function useCragDetail(id: string, enabled = true) {
  return useQuery<CragDetail>({
    queryKey: ['crag', id],
    queryFn: () => api.crags.getById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
