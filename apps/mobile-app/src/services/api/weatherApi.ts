import { apiClient } from './apiClient'
import type { ClimbingConditionsDto } from '@/types/api'

export interface GetClimbingConditionsParams {
  latitude: number
  longitude: number
  aspect?: string | null
}

export const weatherApi = {
  /**
   * Get climbing conditions by coordinates
   *
   * @param params Coordinates and optional aspect
   * @returns Climbing conditions with current weather and scores
   */
  async getConditionsByCoordinates(
    params: GetClimbingConditionsParams,
  ): Promise<ClimbingConditionsDto> {
    const queryParams = new URLSearchParams()
    queryParams.set('lat', params.latitude.toString())
    queryParams.set('lon', params.longitude.toString())
    if (params.aspect) {
      queryParams.set('aspect', params.aspect)
    }

    return apiClient.get<ClimbingConditionsDto>(
      `/weather/conditions?${queryParams.toString()}`,
    )
  },

  /**
   * Get climbing conditions for a specific sector
   *
   * @param sectorId Sector identifier
   * @returns Climbing conditions with current weather and scores
   */
  async getConditionsForSector(
    sectorId: string,
  ): Promise<ClimbingConditionsDto> {
    return apiClient.get<ClimbingConditionsDto>(`/weather/sectors/${sectorId}`)
  },

  /**
   * Get climbing conditions for a specific crag
   *
   * @param cragId Crag identifier
   * @param aspect Optional aspect override
   * @returns Climbing conditions with current weather and scores
   */
  async getConditionsForCrag(
    cragId: string,
    aspect?: string | null,
  ): Promise<ClimbingConditionsDto> {
    const queryParams = aspect ? `?aspect=${aspect}` : ''
    return apiClient.get<ClimbingConditionsDto>(
      `/weather/crags/${cragId}${queryParams}`,
    )
  },
}
