'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useWeather(zoneId: string, days = 7, includeHourly = false) {
  return useQuery({
    queryKey: ['weather', zoneId, days, includeHourly],
    queryFn: () => api.weather.getForecast(zoneId, days, includeHourly),
    enabled: !!zoneId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useWeatherSummary(zoneId: string) {
  return useQuery({
    queryKey: ['weather', 'summary', zoneId],
    queryFn: () => api.weather.getSummary(zoneId),
    enabled: !!zoneId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}




