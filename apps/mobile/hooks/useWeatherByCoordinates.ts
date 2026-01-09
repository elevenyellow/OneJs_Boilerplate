import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useWeatherByCoordinates(
  lat: number | null,
  lon: number | null,
  enabled = true
) {
  return useQuery({
    queryKey: ['weather', 'coordinates', lat, lon],
    queryFn: () => api.weather.getByCoordinates(lat!, lon!),
    enabled: enabled && lat !== null && lon !== null,
    staleTime: 1000 * 60 * 30, // 30 minutes
  })
}
