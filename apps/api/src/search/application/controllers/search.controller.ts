import { Inject, logger, UseAuth } from '@OneJs/core'
import { Controller, Get, type Context } from '@OneJs/server'
import {
  SearchCriteria,
  type SearchCriteriaQueryParams,
} from '../../domain/value-objects/search-criteria.vo'
import { SearchCragsWithScoringUseCase } from '../use-cases/search-crags-with-scoring.use-case'
import type {
  SearchCragsResponseDto,
  ScoredCragDto,
  SearchCragsQueryDto,
} from '../dtos/search-crags.dto'

/**
 * Controller for crag search with scoring
 */
@Controller('/search')
export class SearchController {
  constructor(
    @Inject(SearchCragsWithScoringUseCase)
    private readonly searchUseCase: SearchCragsWithScoringUseCase,
  ) {}

  /**
   * Search for crags with scoring
   * GET /api/search/crags?lat=41.7&lon=1.8&r=50&gmin=24&gmax=32&season=1&limit=20
   *
   * Query parameters (compact names):
   * - lat: latitude
   * - lon: longitude
   * - r: radiusKm
   * - gmin: minGradeBand (10-52)
   * - gmax: maxGradeBand (10-52)
   * - season: seasonPreference (1=summer, 2=winter, omit/0 for any)
   * - exp: exposurePreference (1=sun, 2=shade, omit/0 for any)
   * - style: climbingStyles (array, can repeat)
   * - qmin: minQualityRating (0-3)
   * - limit: result limit (1-100, default 20)
   * - date: queryDate (ISO date for weather, defaults to today)
   */
  @Get('/crags')
  @UseAuth()
  async searchCrags(ctx: Context): Promise<SearchCragsResponseDto> {
    logger.info('🔍 [SearchController] Search crags query:')

    const query = ctx.query as SearchCragsQueryDto

    // Create SearchCriteria from query parameters (handles parsing + validation)
    const criteria = SearchCriteria.createFromQuery(
      query as SearchCriteriaQueryParams,
    )

    logger.info('🔍 [SearchController] Parsed criteria: ', criteria.toString())

    const results = await this.searchUseCase.execute(criteria)
    logger.info(`🔍 [SearchController] Search results count: ${results.length}`)

    // Get user's grade range for calculating routes in range
    const userGradeRange = criteria.getGradeRange()

    // Map to response DTOs
    const scoredCrags: ScoredCragDto[] = results.map((result) => {
      const crag = result.getCrag()
      const breakdown = result.getScoreBreakdown()

      // Get grade range from distribution
      const gradeDistribution = crag.getGradeDistribution()
      const gbRoutes = gradeDistribution.getGbRoutes()

      // Calculate routes in user's search range
      const routesInRange = userGradeRange.getRoutesInRange(gbRoutes)

      return {
        id: crag.getId().toString(),
        externalId: crag.getExternalId().toString(),
        name: crag.getName().getValue(),
        type: crag.getCragType().getType(),
        subType: crag.getCragType().getSubType(),
        latitude: crag.getCoordinates().getLatitude() ?? null,
        longitude: crag.getCoordinates().getLongitude() ?? null,
        headerImage: crag.getHeaderImage().getValue(),
        numberRoutes: crag.getStats().getNumberRoutes(),
        // Grade range as gradeBand indices - client converts to display
        minGradeBand: gradeDistribution.getMinGradeBand(),
        maxGradeBand: gradeDistribution.getMaxGradeBand(),
        // Routes in user's search grade range
        routesInRange,
        seasonality: crag.getSeasonality().getMonths(),
        hasTopo: crag.getHasTopo().getValue(),
        totalScore: result.getTotalScore(),
        distanceKm: result.getDistanceKm() ?? 0,
        scoreBreakdown: {
          distance: breakdown.distance,
          gradeMatch: breakdown.gradeMatch,
          seasonality: breakdown.seasonality,
          routeCount: breakdown.routeCount,
          exposure: breakdown.exposure,
          quality: breakdown.quality,
          style: breakdown.style,
        },
        weatherConditions: result.getWeatherEvaluation()?.toDto() ?? null,
        // Crag quality metrics (0-3 scale)
        overallScore: crag.getStats().getOverallScore(),
        qualityRating: crag.getQualityRating().getValue(),
        popularityScore: crag.getPopularityScore().getValue(),
      }
    })

    return {
      results: scoredCrags,
      total: scoredCrags.length,
      criteria: {
        latitude: criteria.getCoordinates().getLatitude() ?? 0,
        longitude: criteria.getCoordinates().getLongitude() ?? 0,
        radiusKm: criteria.getRadiusKm(),
        minGradeBand: criteria.getGradeRange().getMin(),
        maxGradeBand: criteria.getGradeRange().getMax(),
        seasonPreference: criteria.getSeasonPreference(),
        limit: criteria.getLimit().getValue(),
        exposurePreference: criteria.getExposurePreference(),
        climbingStyles: criteria.getClimbingStyles(),
        minQualityRating: criteria.getMinQualityRating(),
      },
    }
  }
}
