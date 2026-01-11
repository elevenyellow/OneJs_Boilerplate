import { api, type CragDetail } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

interface UseCragDetailOptions {
  enabled?: boolean
}

/**
 * Hook to fetch crag details including sectors with their stats.
 * 
 * Note: Grade range filtering is now done client-side using gradeDistribution
 * from each sector's stats. This avoids re-fetching when the user changes
 * the grade range, improving performance.
 */
export function useCragDetail(
  id: string, 
  options: UseCragDetailOptions = {}
) {
  const { enabled = true } = options
  
  return useQuery<CragDetail>({
    queryKey: ['crag', id],
    queryFn: () => api.crags.getById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
