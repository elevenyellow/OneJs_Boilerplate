import { useQuery } from '@tanstack/react-query';
import { api, type ZoneFilters } from '@/lib/api';

export function useZones(filters?: ZoneFilters) {
  return useQuery({
    queryKey: ['zones', filters],
    queryFn: async () => {
      console.log('[useZones] Fetching all zones with filters:', filters);
      const result = await api.zones.getAll(filters);
      console.log('[useZones] Results:', result?.length ?? 0, 'zones');
      return result;
    },
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
    queryFn: async () => {
      console.log('[useNearbyZones] Fetching zones:', { lat, lng, radiusKm });
      const result = await api.zones.getNearby(lat, lng, radiusKm);
      console.log('[useNearbyZones] Results:', result?.length ?? 0, 'zones');
      return result;
    },
    enabled: enabled && !!lat && !!lng,
  });
}




