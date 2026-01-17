import { useQuery } from '@tanstack/react-query'
import { weatherApi } from '@/services/api/weatherApi'

interface UseClimbingConditionsParams {
  latitude?: number | null
  longitude?: number | null
  aspect?: string | null
  enabled?: boolean
}

/**
 * Hook to fetch real-time climbing conditions based on coordinates
 *
 * @param params Coordinates and aspect for weather lookup
 * @returns Climbing conditions data with current weather
 */
export function useClimbingConditions(params: UseClimbingConditionsParams) {
  const { latitude, longitude, aspect, enabled = true } = params

  const hasValidCoordinates =
    latitude !== null &&
    latitude !== undefined &&
    longitude !== null &&
    longitude !== undefined

  return useQuery({
    queryKey: ['climbing-conditions', latitude, longitude, aspect],
    queryFn: () =>
      weatherApi.getConditionsByCoordinates({
        latitude: latitude!,
        longitude: longitude!,
        aspect,
      }),
    enabled: enabled && hasValidCoordinates,
    staleTime: 1000 * 60 * 15, // 15 minutes - weather doesn't change that often
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
    retry: 2,
  })
}
