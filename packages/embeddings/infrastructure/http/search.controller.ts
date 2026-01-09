import { SearchZonesUseCase, SearchZonesQuery } from '../../application/use-cases/search-zones.use-case'
import { IndexZoneUseCase } from '../../application/use-cases/index-zone.use-case'
import { IndexAllZonesUseCase } from '../../application/use-cases/index-all-zones.use-case'

/**
 * Search Controller
 * REST API endpoints for zone search and indexing
 */
export class SearchController {
  constructor(
    private searchZonesUseCase: SearchZonesUseCase,
    private indexZoneUseCase: IndexZoneUseCase,
    private indexAllZonesUseCase: IndexAllZonesUseCase,
  ) {}

  /**
   * POST /api/search/zones
   * Search climbing zones using semantic search + filters
   * 
   * Example request body:
   * {
   *   "query": "sport climbing on vertical walls with good holds",
   *   "userLocation": { "lat": 39.5, "lon": -0.5 },
   *   "maxDistance": 100,
   *   "gradeRange": { "min": "6a", "max": "7a" },
   *   "month": 10,
   *   "minRoutes": 20,
   *   "orientations": ["N", "NE"],
   *   "limit": 20
   * }
   */
  async search(request: any): Promise<any> {
    try {
      const query: SearchZonesQuery = {
        query: request.body.query,
        userLocation: request.body.userLocation,
        maxDistance: request.body.maxDistance,
        gradeRange: request.body.gradeRange,
        minRoutes: request.body.minRoutes,
        routeTypes: request.body.routeTypes,
        month: request.body.month,
        seasonPreference: request.body.seasonPreference,
        orientations: request.body.orientations,
        rockTypes: request.body.rockTypes,
        climbingStyles: request.body.climbingStyles,
        minQuality: request.body.minQuality,
        minPopularity: request.body.minPopularity,
        hasTopos: request.body.hasTopos,
        requiresPermit: request.body.requiresPermit,
        limit: request.body.limit || 20,
        offset: request.body.offset || 0,
      }

      const results = await this.searchZonesUseCase.execute(query)

      return {
        success: true,
        data: {
          results,
          total: results.length,
          query: query.query,
        },
      }
    } catch (error) {
      console.error('Search error:', error)
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Search failed',
          code: 'SEARCH_ERROR',
        },
      }
    }
  }

  /**
   * GET /api/search/zones?q=...&lat=...&lon=...&maxDistance=...
   * Search using query parameters (alternative to POST)
   */
  async searchGet(request: any): Promise<any> {
    try {
      const params = request.query

      const query: SearchZonesQuery = {
        query: params.q,
        userLocation:
          params.lat && params.lon
            ? { lat: parseFloat(params.lat), lon: parseFloat(params.lon) }
            : undefined,
        maxDistance: params.maxDistance ? parseInt(params.maxDistance) : undefined,
        gradeRange:
          params.minGrade && params.maxGrade
            ? { min: params.minGrade, max: params.maxGrade }
            : undefined,
        minRoutes: params.minRoutes ? parseInt(params.minRoutes) : undefined,
        month: params.month ? parseInt(params.month) : undefined,
        orientations: params.orientations?.split(','),
        rockTypes: params.rockTypes?.split(','),
        climbingStyles: params.climbingStyles?.split(','),
        minQuality: params.minQuality ? parseFloat(params.minQuality) : undefined,
        minPopularity: params.minPopularity
          ? parseFloat(params.minPopularity)
          : undefined,
        hasTopos: params.hasTopos === 'true',
        limit: params.limit ? parseInt(params.limit) : 20,
        offset: params.offset ? parseInt(params.offset) : 0,
      }

      const results = await this.searchZonesUseCase.execute(query)

      return {
        success: true,
        data: {
          results,
          total: results.length,
        },
      }
    } catch (error) {
      console.error('Search error:', error)
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Search failed',
          code: 'SEARCH_ERROR',
        },
      }
    }
  }

  /**
   * POST /api/admin/index-zone/:cragId
   * Index or re-index a specific crag
   */
  async indexZone(request: any): Promise<any> {
    try {
      const cragId = request.params.cragId

      if (!cragId) {
        return {
          success: false,
          error: {
            message: 'Crag ID is required',
            code: 'MISSING_CRAG_ID',
          },
        }
      }

      const result = await this.indexZoneUseCase.execute(cragId)

      return {
        success: true,
        data: {
          message: 'Zone indexed successfully',
          zoneId: result.zoneId,
          dimensions: result.embedding.getDimensions(),
        },
      }
    } catch (error) {
      console.error('Indexing error:', error)
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Indexing failed',
          code: 'INDEX_ERROR',
        },
      }
    }
  }

  /**
   * POST /api/admin/index-all-zones
   * Index all crags in the database
   */
  async indexAllZones(request: any): Promise<any> {
    try {
      const options = {
        batchSize: request.body?.batchSize || 10,
        skipExisting: request.body?.skipExisting || false,
      }

      const stats = await this.indexAllZonesUseCase.execute(options)

      return {
        success: true,
        data: {
          message: 'Batch indexing completed',
          stats,
        },
      }
    } catch (error) {
      console.error('Batch indexing error:', error)
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Batch indexing failed',
          code: 'BATCH_INDEX_ERROR',
        },
      }
    }
  }
}
