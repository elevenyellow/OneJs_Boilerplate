import { Inject } from '@OneJs/core'
import type { Context } from '@OneJs/server'
import { Controller, Post } from '@OneJs/server'
import {
  SearchSectorsUseCase,
  type SearchSectorsDto,
} from '@sector'

/**
 * Sector Search Controller
 * Provides intelligent sector search endpoints with multi-factor scoring
 */
@Controller('/sectors')
export class SectorController {
  constructor(
    @Inject(SearchSectorsUseCase)
    private readonly searchSectorsUseCase: SearchSectorsUseCase,
  ) {}

  /**
   * POST /api/sectors/search
   * Intelligent sector search with distance, grade, and seasonal filtering
   *
   * Request body example:
   * {
   *   "userLocation": { "lat": 39.5, "lon": -0.5 },
   *   "gradeRange": { "min": "6b", "max": "7a" },
   *   "maxDistance": 80,
   *   "currentMonth": 7,
   *   "minRoutes": 10,
   *   "rockTypes": ["Limestone"],
   *   "limit": 20
   * }
   */
  @Post('/search')
  async search(context: Context) {
    try {
      const body = context.body as SearchSectorsDto

      // Validate required fields
      if (!body.userLocation?.lat || !body.userLocation?.lon) {
        context.set.status = 400
        return {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'userLocation with lat and lon is required',
          },
        }
      }

      if (!body.gradeRange?.min || !body.gradeRange?.max) {
        context.set.status = 400
        return {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'gradeRange with min and max is required',
          },
        }
      }

      // Execute search
      const response = await this.searchSectorsUseCase.execute(body)

      context.set.status = 200
      return {
        success: true,
        data: response,
      }
    } catch (error) {
      console.error('Sector search error:', error)

      context.set.status = 500
      return {
        success: false,
        error: {
          code: 'SEARCH_ERROR',
          message: error instanceof Error ? error.message : 'Search failed',
        },
      }
    }
  }
}
