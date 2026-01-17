import { useQuery } from '@tanstack/react-query'
import {
  getCragOverviewWithSectors,
  getSectorRoutes,
  getCragRoutes,
  SectorApiError,
} from '@/services/api/sectorApi'
import type {
  CragOverviewWithSectors,
  SectorRoutesResponse,
  RouteDto,
  SectorDto,
  SectorPhotoWithAreasDto,
} from '@/types/api'

/**
 * Hook for fetching crag overview photo with sectors
 *
 * @param cragId Crag identifier
 * @param enabled Whether to enable the query (default: true)
 * @returns Query result with crag overview and photo
 */
export function useCragOverviewWithSectors(cragId: string, enabled = true) {
  return useQuery<CragOverviewWithSectors, SectorApiError>({
    queryKey: ['cragOverviewWithSectors', cragId],
    queryFn: () => getCragOverviewWithSectors(cragId),
    enabled: enabled && !!cragId,
    staleTime: 10 * 60 * 1000, // 10 minutes (changes less frequently)
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Combined sector data for the sector detail screen
 */
export interface SectorWithRoutesData {
  sector: SectorDto | null
  routes: RouteDto[]
  children: SectorDto[]
  photos: SectorPhotoWithAreasDto[]
  parent: SectorDto | null
  totalRoutes: number
  isLoading: boolean
  isError: boolean
  error: SectorApiError | null
}

/**
 * Hook for fetching sector with routes (single API call)
 * Returns sector details, hierarchy, photos, and routes
 *
 * Grade data is returned as gradeBand (numeric) - use GradeConverter to display
 *
 * @param sectorId Sector identifier
 * @param enabled Whether to enable the query (default: true)
 * @returns Combined sector and routes data
 */
export function useSectorWithRoutes(
  sectorId: string,
  enabled = true,
): SectorWithRoutesData {
  const query = useQuery<SectorRoutesResponse, SectorApiError>({
    queryKey: ['sectorWithRoutes', sectorId],
    queryFn: () => getSectorRoutes(sectorId),
    enabled: enabled && !!sectorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  return {
    sector: query.data?.sector ?? null,
    routes: query.data?.routes ?? [],
    children: query.data?.children ?? [],
    photos: query.data?.photos ?? [],
    parent: query.data?.parent ?? null,
    totalRoutes: query.data?.totalCount ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ?? null,
  }
}

/**
 * Hook for fetching crag routes directly (for crags without sectors)
 * Used when hasSectors=false but the crag has routes
 *
 * Grade data is returned as gradeBand (numeric) - use GradeConverter to display
 *
 * @param cragId Crag identifier
 * @param enabled Whether to enable the query (default: true)
 * @returns Combined crag data in sector format with routes
 */
export function useCragWithRoutes(
  cragId: string,
  enabled = true,
): SectorWithRoutesData {
  const query = useQuery<SectorRoutesResponse, SectorApiError>({
    queryKey: ['cragWithRoutes', cragId],
    queryFn: () => getCragRoutes(cragId),
    enabled: enabled && !!cragId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  return {
    sector: query.data?.sector ?? null,
    routes: query.data?.routes ?? [],
    children: query.data?.children ?? [],
    photos: query.data?.photos ?? [],
    parent: query.data?.parent ?? null,
    totalRoutes: query.data?.totalCount ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ?? null,
  }
}
