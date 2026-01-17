/**
 * Crag Search API
 * API calls for searching crags with scoring algorithm
 */

import { apiClient } from './apiClient'
import { devLog } from '@/utils/logger'
import type { SearchCragsRequestDto, SearchCragsResponseDto } from '@/types/api'

// Re-export ApiError for backwards compatibility
export { ApiError as CragSearchError } from './errors'

/**
 * Encode season preference to numeric code
 * 0 = any, 1 = summer, 2 = winter
 */
function encodeSeasonPreference(
  season?: 'summer' | 'winter' | 'any',
): number | undefined {
  if (!season || season === 'any') return undefined
  return season === 'summer' ? 1 : 2
}

/**
 * Encode exposure preference to numeric code
 * 0 = any, 1 = sun, 2 = shade
 */
function encodeExposurePreference(
  exposure?: 'sun' | 'shade' | 'any',
): number | undefined {
  if (!exposure || exposure === 'any') return undefined
  return exposure === 'sun' ? 1 : 2
}

/**
 * Search for crags using the backend scoring algorithm
 * GET /api/search/crags
 *
 * Query parameter mapping (compact names for URL efficiency):
 * - lat: latitude
 * - lon: longitude
 * - r: radiusKm
 * - gmin: minGradeBand
 * - gmax: maxGradeBand
 * - season: seasonPreference (1=summer, 2=winter, omit for any)
 * - exp: exposurePreference (1=sun, 2=shade, omit for any)
 * - style: climbingStyles (array)
 * - qmin: minQualityRating
 * - limit: limit
 * - date: queryDate
 *
 * @param params Search parameters (location, grades, radius, etc.)
 * @returns Search response with scored crags
 */
export async function searchCrags(
  params: SearchCragsRequestDto,
): Promise<SearchCragsResponseDto> {
  // Build query string with compact parameter names
  const queryParams = new URLSearchParams({
    lat: params.latitude.toString(),
    lon: params.longitude.toString(),
    r: params.radiusKm.toString(),
    gmin: params.minGradeBand.toString(),
    gmax: params.maxGradeBand.toString(),
  })

  // Add optional parameters with compact names
  const seasonCode = encodeSeasonPreference(params.seasonPreference)
  if (seasonCode !== undefined) {
    queryParams.append('season', seasonCode.toString())
  }

  if (params.limit) {
    queryParams.append('limit', params.limit.toString())
  }

  // Exposure preference (1=sun, 2=shade)
  const expCode = encodeExposurePreference(params.exposurePreference)
  if (expCode !== undefined) {
    queryParams.append('exp', expCode.toString())
  }

  // Climbing styles
  if (params.climbingStyles && params.climbingStyles.length > 0) {
    for (const style of params.climbingStyles) {
      queryParams.append('style', style)
    }
  }

  // Minimum quality rating
  if (params.minQualityRating && params.minQualityRating > 0) {
    queryParams.append('qmin', params.minQualityRating.toString())
  }

  // Query date
  if (params.queryDate) {
    queryParams.append('date', params.queryDate)
  }

  const endpoint = `/search/crags?${queryParams.toString()}`

  devLog.log('🔍 [CragSearch] Search params:', params)

  const response = await apiClient.get<SearchCragsResponseDto>(endpoint)

  devLog.log('✅ [CragSearch] Results:', {
    resultsCount: response.results?.length || 0,
    total: response.total,
  })

  // Validate response structure
  if (!response || !Array.isArray(response.results)) {
    throw new Error('Invalid response format from API')
  }

  return response
}
