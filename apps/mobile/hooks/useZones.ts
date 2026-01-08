import { useQuery } from '@tanstack/react-query';
import { api, type Zone, type ZoneDetail, type ZoneFilters } from '@/lib/api';

export function useZones(filters?: ZoneFilters) {
  return useQuery({
    queryKey: ['zones', filters],
    queryFn: () => api.zones.getAll(filters),
  });
}

export function useZoneDetail(id: string) {
  return useQuery({
    queryKey: ['zone', id],
    queryFn: () => api.zones.getById(id),
    enabled: !!id,
  });
}

export function useNearbyZones(lat: number, lng: number, radiusKm = 50, enabled = true) {
  return useQuery({
    queryKey: ['zones', 'nearby', lat, lng, radiusKm],
    queryFn: () => api.zones.getNearby(lat, lng, radiusKm),
    enabled: enabled && !!lat && !!lng,
  });
}




