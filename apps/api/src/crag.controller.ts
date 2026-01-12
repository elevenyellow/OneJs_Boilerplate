import { GetCragDetailUseCase } from '@crag/application/use-cases/get-crag-detail.use-case'
import { GetNearbyCragsUseCase } from '@crag/application/use-cases/get-nearby-crags.use-case'
import { Inject } from '@OneJs/core'
import type { Context } from '@OneJs/server'
import { Controller, Get, Post } from '@OneJs/server'
import { SearchCragsUseCase, type SearchCragsDto } from '@sector'

/**
 * Crag Controller
 * Provides crag search with integrated weather data and detailed crag information
 *
 * A crag is a climbing area containing multiple sectors and routes.
 * This controller groups sectors by crag and includes weather conditions.
 */
@Controller('/crags')
export class CragController {
  constructor(
    @Inject(SearchCragsUseCase)
    private readonly searchCragsUseCase: SearchCragsUseCase,
    @Inject(GetCragDetailUseCase)
    private readonly getCragDetailUseCase: GetCragDetailUseCase,
    @Inject(GetNearbyCragsUseCase)
    private readonly getNearbyCragsUseCase: GetNearbyCragsUseCase,
  ) {}

  /**
   * POST /api/crags/search
   * Search crags with integrated weather data
   *
   * Request body example:
   * {
   *   "userLocation": { "lat": 39.5, "lon": -0.5 },
   *   "gradeRange": { "min": "6a", "max": "7b" },
   *   "maxDistance": 100,
   *   "limit": 20
   * }
   *
   * Response includes:
   * - Crags with all their sectors grouped
   * - Current weather conditions (temperature, isGoodForClimbing)
   * - Distance from user location
   * - Total routes in user's grade range
   */
  @Post('/search')
  async searchCrags(context: Context) {
    const body = context.body as SearchCragsDto

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
    const response = await this.searchCragsUseCase.execute(body)

    // 🚀 HTTP Cache headers - búsqueda de crags, caché por 5 minutos
    context.set.headers = {
      ...context.set.headers,
      'Cache-Control': 'private, max-age=300', // 5 minutos
      Vary: 'Accept-Encoding',
    }

    context.set.status = 200
    return response
  }

  /**
   * GET /api/crags/nearby
   * List all crags within a distance range with optional search
   *
   * Query params:
   * - lat: User latitude (required)
   * - lon: User longitude (required)
   * - maxDistance: Maximum distance in km (default: 100)
   * - search: Search term for crag name (optional)
   * - limit: Max results (default: 50)
   * - offset: Pagination offset (default: 0)
   *
   * Response includes:
   * - List of crags sorted by distance
   * - Basic crag info (name, location, stats)
   * - Distance from user
   */
  @Get('/nearby')
  async getNearbyCrags(context: Context) {
    const query = context.query as Record<string, string | undefined>

    // Validate required params
    const lat = query.lat ? parseFloat(query.lat) : null
    const lon = query.lon ? parseFloat(query.lon) : null

    if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) {
      context.set.status = 400
      return {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'lat and lon query parameters are required',
        },
      }
    }

    const response = await this.getNearbyCragsUseCase.execute({
      latitude: lat,
      longitude: lon,
      maxDistanceKm: query.maxDistance ? parseFloat(query.maxDistance) : 100,
      search: query.search?.trim() || undefined,
      limit: query.limit ? parseInt(query.limit, 10) : 50,
      offset: query.offset ? parseInt(query.offset, 10) : 0,
    })

    // 🚀 HTTP Cache headers - lista de crags nearby, caché por 10 minutos
    context.set.headers = {
      ...context.set.headers,
      'Cache-Control': 'public, max-age=600', // 10 minutos
      Vary: 'Accept-Encoding',
    }

    context.set.status = 200
    return response
  }

  /**
   * GET /api/crags/:id
   * Get detailed crag information including:
   * - Basic crag info (name, description, coordinates)
   * - 7-day weather forecast
   * - All sectors with gradeDistribution for client-side filtering
   * - Top routes (sorted by stars/ascents)
   *
   * Note: Grade filtering and scoring are done client-side using
   * the gradeDistribution returned for each sector. This allows
   * instant updates when the user changes their grade range.
   */
  @Get('/:id')
  async getCragDetail(context: Context) {
    const { id } = context.params as { id: string }

    try {
      const detail = await this.getCragDetailUseCase.execute(id)

      // 🚀 HTTP Cache headers - detalle de crag, caché por 15 minutos
      context.set.headers = {
        ...context.set.headers,
        'Cache-Control': 'public, max-age=900', // 15 minutos
        Vary: 'Accept-Encoding',
      }

      context.set.status = 200
      return detail
    } catch (error: unknown) {
      const err = error as { statusCode?: number }
      if (err.statusCode === 404) {
        context.set.status = 404
        return {
          success: false,
          error: {
            code: 'CRAG_NOT_FOUND',
            message: `Crag with id "${id}" not found`,
          },
        }
      }
      throw error
    }
  }
}
