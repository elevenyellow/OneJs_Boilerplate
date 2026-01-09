import { Inject } from '@OneJs/core'
import type { Context } from '@OneJs/server'
import { Controller, Get, Post } from '@OneJs/server'
import { SearchSectorsUseCase, type SearchSectorsDto } from '@sector'
import { RoutePrismaRepository } from '@route/infrastructure/persistence/prisma/route.repository'
import { SectorId } from '@sector/domain/value-objects/sector-id.vo'

/**
 * Sector Search Controller
 * Provides intelligent sector search with multi-factor scoring
 *
 * Note: Sectors are the primary search unit because each sector has its own
 * orientation, microclimate, and conditions. Even within the same crag,
 * different sectors can have completely different orientations (N vs S).
 */
@Controller('/sectors')
export class SectorController {
  constructor(
    @Inject(SearchSectorsUseCase)
    private readonly searchSectorsUseCase: SearchSectorsUseCase,
    @Inject(RoutePrismaRepository)
    private readonly routeRepository: RoutePrismaRepository,
  ) {}

  /**
   * POST /api/sectors/search
   * Intelligent sector search with distance, grade, and weather filtering
   *
   * Each sector is scored individually because:
   * - Different sectors in the same crag have different orientations (N, S, E, W)
   * - Microclimates vary between sectors (sun/shade, wind exposure)
   * - Route quality and density differ per sector
   *
   * Request body example:
   * {
   *   "userLocation": { "lat": 39.5, "lon": -0.5 },
   *   "gradeRange": { "min": "6b", "max": "7a" },
   *   "maxDistance": 80,
   *   "forceOrientation": "shade",  // optional: "sun" | "shade" | "any"
   *   "minRoutes": 10,
   *   "rockTypes": ["Limestone"],
   *   "hasTopo": true,
   *   "limit": 20
   * }
   *
   * Response includes:
   * - Individual sector results with orientation-specific scoring
   * - Weather conditions (temperature, wind, rain)
   * - Orientation bonus (+10 points for perfect orientation)
   * - Match reasons explaining why each sector is relevant
   */
  @Post('/search')
  async search(context: Context) {
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
    return response
  }

  /**
   * GET /api/sectors/:id/routes
   * Get all routes for a specific sector
   *
   * Query params:
   * - minGrade: Filter by minimum grade (e.g., "6a")
   * - maxGrade: Filter by maximum grade (e.g., "7b")
   * - minStars: Filter by minimum stars (1-3)
   * - limit: Max number of routes (default: 100)
   *
   * Response includes:
   * - Route name, grade, stars, ascents
   * - Height, bolts, pitches
   * - Route type (sport, trad, boulder)
   */
  @Get('/:id/routes')
  async getSectorRoutes(context: Context) {
    const { id } = context.params as { id: string }
    const query = context.query as Record<string, string | undefined>

    try {
      const sectorId = SectorId.fromString(id)

      // Build filters from query params
      const filters: {
        sectorId: SectorId
        minGradeIndex?: number
        maxGradeIndex?: number
        minStars?: number
        limit?: number
      } = {
        sectorId,
        limit: query.limit ? parseInt(query.limit, 10) : 100,
      }

      if (query.minStars) {
        filters.minStars = parseInt(query.minStars, 10)
      }

      // Note: Grade filtering would need Grade.calculateIndexFromString
      // For now, we'll fetch all routes for the sector

      const routes = await this.routeRepository.findWithFilters(filters)

      context.set.status = 200
      return {
        sectorId: id,
        total: routes.length,
        routes: routes.map((route) => route.toJSON()),
      }
    } catch {
      context.set.status = 400
      return {
        success: false,
        error: {
          code: 'INVALID_SECTOR_ID',
          message: `Invalid sector ID: ${id}`,
        },
      }
    }
  }
}
