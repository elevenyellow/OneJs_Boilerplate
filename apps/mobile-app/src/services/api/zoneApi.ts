/**
 * Zone API
 * API calls for zone-related data
 */

import { apiClient } from './apiClient'
import type { ZoneOverviewWithSectorsDto } from '@/types/api'

export const zoneApi = {
  /**
   * Get zone overview with sectors
   *
   * @param zoneId Zone identifier
   * @param gradingSystem User's preferred grading system
   * @returns Zone overview with sectors data
   */
  async getZoneOverview(
    zoneId: string,
    gradingSystem?: string,
  ): Promise<ZoneOverviewWithSectorsDto> {
    const queryParams = gradingSystem ? `?gradingSystem=${gradingSystem}` : ''
    return apiClient.get<ZoneOverviewWithSectorsDto>(
      `/zones/${zoneId}/overview${queryParams}`,
    )
  },
}
