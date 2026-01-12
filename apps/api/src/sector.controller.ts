import { TopoPrismaRepository } from '@climb-zone/topo'
import { Inject } from '@OneJs/core'
import type { Context } from '@OneJs/server'
import { Controller, Get, Post } from '@OneJs/server'
import { RoutePrismaRepository } from '@route/infrastructure/persistence/prisma/route.repository'
import { SearchSectorsUseCase, type SearchSectorsDto } from '@sector'
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
    @Inject(TopoPrismaRepository)
    private readonly topoRepository: TopoPrismaRepository,
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
   *   "kidFriendly": true,          // optional: filter for kid-friendly sectors
   *   "dogFriendly": true,          // optional: filter for dog-friendly sectors
   *   "beginner": true,             // optional: filter for beginner-friendly sectors
   *   "accessible": true,           // optional: filter for accessible sectors
   *   "limit": 20
   * }
   *
   * Response includes:
   * - Individual sector results with orientation-specific scoring
   * - Weather conditions (temperature, wind, rain)
   * - Orientation bonus (+10 points for perfect orientation)
   * - Match reasons explaining why each sector is relevant
   * - Sector tags (kidFriendly, dogFriendly, accessible, scenic, etc.)
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

    // 🚀 HTTP Cache headers - permite caché del cliente por 5 minutos
    context.set.headers = {
      ...context.set.headers,
      'Cache-Control': 'private, max-age=300', // 5 minutos
      Vary: 'Accept-Encoding',
    }

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

      // 🚀 HTTP Cache headers - rutas cambian raramente, caché por 15 minutos
      context.set.headers = {
        ...context.set.headers,
        'Cache-Control': 'public, max-age=900', // 15 minutos
        Vary: 'Accept-Encoding',
      }

      context.set.status = 200
      return {
        sectorId: id,
        total: routes.length,
        routes: routes.map((route) => {
          const json = route.toJSON()
          return {
            ...json,
            stars: json.rating, // Frontend expects 'stars', entity uses 'rating'
          }
        }),
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

  /**
   * GET /api/sectors/:id/topos
   * Get all topo images for a specific sector
   *
   * Response includes:
   * - Topo image URLs (thumbnail and full)
   * - Image dimensions
   * - Routes on each topo with their SVG path coordinates
   */
  @Get('/:id/topos')
  async getSectorTopos(context: Context) {
    const { id } = context.params as { id: string }

    try {
      const sectorId = SectorId.fromString(id)

      // Get all topo images for this sector
      const topoImages = await this.topoRepository.findBySectorId(sectorId)

      // For each topo, get the route positions
      const toposWithRoutes = await Promise.all(
        topoImages.map(async (topo) => {
          const positions = await this.topoRepository.findPositionsByTopoId(
            topo.id,
          )

          // Get route details for each position
          const routeIds = positions.map((p) => p.routeId)
          const routes = await Promise.all(
            routeIds.map((routeId) => this.routeRepository.findById(routeId)),
          )

          // Combine position data with route details
          const routesData = positions.map((position, idx) => {
            const route = routes[idx]
            return {
              routeId: position.routeId.toString(),
              routeExternalId: route?.externalId.toNumber() ?? 0,
              topoNumber: position.topoNumber,
              points: position.points,
              gradeClass: position.gradeClass,
              name: route?.name.toString() ?? 'Unknown',
              grade: route?.gradeString ?? null,
            }
          })

          return {
            id: topo.id.toString(),
            externalId: topo.externalId,
            sectorId: topo.sectorId.toString(),
            thumbnailUrl: topo.getThumbnailUrl(),
            fullImageUrl: topo.getFullImageUrl(),
            width: topo.width,
            height: topo.height,
            originalWidth: topo.originalWidth,
            originalHeight: topo.originalHeight,
            viewScale: topo.viewScale,
            routes: routesData,
          }
        }),
      )

      // 🚀 HTTP Cache headers - topos cambian muy raramente
      context.set.headers = {
        ...context.set.headers,
        'Cache-Control': 'public, max-age=3600', // 1 hora
        Vary: 'Accept-Encoding',
      }

      context.set.status = 200
      return {
        sectorId: id,
        topos: toposWithRoutes,
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
