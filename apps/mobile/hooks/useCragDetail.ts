import { api, type CragDetail } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

interface UseCragDetailOptions {
  gradeRange?: { min: string; max: string }
  enabled?: boolean
}

export function useCragDetail(
  id: string, 
  options: UseCragDetailOptions = {}
) {
  const { gradeRange, enabled = true } = options
  
  return useQuery<CragDetail>({
    // Include gradeRange in query key so it refetches when range changes
    queryKey: ['crag', id, gradeRange],
    queryFn: () => api.crags.getById(id, gradeRange),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
