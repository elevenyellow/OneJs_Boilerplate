/**
 * Sector API
 * API calls for sector and crag-related data
 */

import { apiClient } from './apiClient'
import type { CragOverviewWithSectors, SectorRoutesResponse } from '@/types/api'

// Re-export ApiError for backwards compatibility
export { ApiError as SectorApiError } from './errors'

/**
 * Get crag overview photo with all sector areas marked
 * GET /api/crags/:cragId/overview-photo-with-sectors
 *
 * @param cragId Crag identifier
 * @returns Crag info with overview photo showing all sectors
 */
export async function getCragOverviewWithSectors(
  cragId: string,
): Promise<CragOverviewWithSectors> {
  return apiClient.get<CragOverviewWithSectors>(
    `/crags/${cragId}/overview-photo-with-sectors`,
  )
}

/**
 * Get sector with routes (single API call)
 * Returns sector details, hierarchy, photos, and routes
 * GET /api/sectors/:sectorId/routes
 *
 * Grade data is returned as gradeBand (numeric) - convert to display using GradeConverter
 *
 * @param sectorId Sector identifier
 * @returns Sector details with hierarchy, photos, and routes
 */
export async function getSectorRoutes(
  sectorId: string,
): Promise<SectorRoutesResponse> {
  return apiClient.get<SectorRoutesResponse>(`/sectors/${sectorId}/routes`)
}

/**
 * Get routes directly associated with a crag (no sector)
 * Used for crags with virtual sectors where routes don't have a sectorId
 * GET /api/crags/:cragId/routes
 *
 * Grade data is returned as gradeBand (numeric) - convert to display using GradeConverter
 *
 * @param cragId Crag identifier
 * @returns Crag info as virtual sector with routes
 */
export async function getCragRoutes(
  cragId: string,
): Promise<SectorRoutesResponse> {
  return apiClient.get<SectorRoutesResponse>(`/crags/${cragId}/routes`)
}
