import { Inject, Injectable } from '@OneJs/core'
import { Coordinates, Grade } from '@climb-zone/shared'
import { CragId } from '@crag/domain/value-objects/crag-id.vo'
import { ClimbingConditionsService } from '@sector/application/services/climbing-conditions.service'
import {
  SectorScoringService,
  type OrientationPreference,
} from '@sector/application/services/sector-scoring.service'
import type {
  AdvancedSearchFilters,
  SearchSectorsDto,
  SearchSectorsResponse,
} from '@sector/domain/dtos/search-sectors.dto'
import { SectorPrismaRepository } from '@sector/infrastructure/persistence/prisma/sector.repository'
import type { DailyForecast, WeatherData } from '@weather'
import { WeatherService } from '@weather'

// Cache key for weather data based on rounded coordinates (to group nearby locations)
function getWeatherCacheKey(lat: number, lon: number): string {
  // Round to 1 decimal place (~11km precision) to group nearby crags
  return `${Math.round(lat * 10) / 10},${Math.round(lon * 10) / 10}`
}

/**
 * Use Case: Search sectors with intelligent filtering and scoring
 *
 * Features:
 * - Distance-based filtering with user location
 * - Automatic orientation preference based on season
 * - Grade range matching with route distribution analysis
 * - Multi-factor relevance scoring
 */
@Injectable()
export class SearchSectorsUseCase {
  constructor(
    @Inject(SectorPrismaRepository)
    private readonly sectorRepository: SectorPrismaRepository,
    @Inject(SectorScoringService)
    private readonly scoringService: SectorScoringService,
    @Inject(ClimbingConditionsService)
    private readonly conditionsService: ClimbingConditionsService,
    @Inject(WeatherService)
    private readonly weatherService: WeatherService,
  ) {}

  async execute(dto: SearchSectorsDto): Promise<SearchSectorsResponse> {
    const startTime = Date.now()

    // 1. Prepare search parameters
    const userLocation = new Coordinates(
      dto.userLocation.lat,
      dto.userLocation.lon,
    )
    const maxDistance = dto.maxDistance ?? 100 // default 100km
    const limit = dto.limit ?? 20
    const offset = dto.offset ?? 0

    // 2. Calculate grade indices
    const minGradeIndex = Grade.calculateIndexFromString(dto.gradeRange.min)
    const maxGradeIndex = Grade.calculateIndexFromString(dto.gradeRange.max)

    if (minGradeIndex === null || maxGradeIndex === null) {
      throw new Error(
        `Invalid grade range: ${dto.gradeRange.min} - ${dto.gradeRange.max}`,
      )
    }

    // 3. Determine base orientation preference (will be refined per-sector based on weather)
    const baseOrientationPreference: OrientationPreference =
      dto.forceOrientation ?? 'any'

    // 4. Calculate geographic bounds (bounding box)
    const { latMin, latMax, lonMin, lonMax } = this.calculateGeographicBounds(
      userLocation,
      maxDistance,
    )

    // 5. Build advanced filters
    // We need to fetch ALL candidates that match the filters to properly score and paginate.
    // Using a large limit to ensure we get comprehensive results for accurate totals and pagination.
    // The offset is handled after scoring and grouping by crag.
    const advancedFilters: AdvancedSearchFilters = {
      latitudeMin: latMin,
      latitudeMax: latMax,
      longitudeMin: lonMin,
      longitudeMax: lonMax,
      minGradeIndex,
      maxGradeIndex,
      minRoutes: dto.minRoutes,
      rockTypes: dto.rockTypes,
      climbingStyles: dto.climbingStyles,
      hasTopo: dto.hasTopo,
      requiresNoPermit: dto.requiresNoPermit,
      // Tag-based filters
      kidFriendly: dto.kidFriendly,
      dogFriendly: dto.dogFriendly,
      beginner: dto.beginner,
      accessible: dto.accessible,
      limit: 500, // Fetch a large number of candidates to ensure comprehensive results
      offset: 0, // We handle pagination after scoring and grouping
    }

    // 6. Fetch candidate sectors from database (with routes)
    const candidates =
      await this.sectorRepository.searchWithAdvancedFilters(advancedFilters)

    // 7. Fetch weather data for each unique location (cached by rounded coords)
    const weatherCache = new Map<string, WeatherData>()
    const weatherPromises: Promise<void>[] = []

    // Collect unique locations to fetch weather for
    for (const sectorWithRoutes of candidates) {
      const sector = sectorWithRoutes.entity
      if (sector.latitude !== null && sector.longitude !== null) {
        const cacheKey = getWeatherCacheKey(sector.latitude, sector.longitude)
        if (!weatherCache.has(cacheKey)) {
          // Mark as pending to avoid duplicate requests
          weatherCache.set(cacheKey, null as unknown as WeatherData)
          weatherPromises.push(
            this.weatherService
              .getByCoordinates({
                latitude: sector.latitude,
                longitude: sector.longitude,
              })
              .parsed()
              .then((data) => {
                weatherCache.set(cacheKey, data)
              })
              .catch(() => {
                // If weather fetch fails, remove from cache (will use fallback)
                weatherCache.delete(cacheKey)
              }),
          )
        }
      }
    }

    // Wait for all weather requests (parallel)
    await Promise.all(weatherPromises)

    // 8. Score all candidates with weather conditions per sector
    const scoredResults = candidates.map((sectorWithRoutes) => {
      const sector = sectorWithRoutes.entity
      const allRoutes = sectorWithRoutes.routes
      const cragInfo = sectorWithRoutes.crag

      // Filter routes in user's grade range
      const routesInRange = allRoutes.filter((route) => {
        if (!route.gradeIndex) return false
        return (
          route.gradeIndex >= minGradeIndex && route.gradeIndex <= maxGradeIndex
        )
      })

      // Get weather data for this sector's location
      let sectorWeatherForecast: DailyForecast[] | null = null
      let orientationPreference: OrientationPreference =
        baseOrientationPreference

      if (sector.latitude !== null && sector.longitude !== null) {
        const cacheKey = getWeatherCacheKey(sector.latitude, sector.longitude)
        const weatherData = weatherCache.get(cacheKey)
        if (weatherData) {
          sectorWeatherForecast = weatherData.daily.slice(0, 3)

          // Calculate average temperature for this sector's location
          const avgTemperature =
            sectorWeatherForecast.reduce(
              (sum, day) => sum + day.temperature.mean,
              0,
            ) / sectorWeatherForecast.length

          // Override orientation based on actual weather at sector location
          if (!dto.forceOrientation) {
            orientationPreference =
              this.conditionsService.getPreferredOrientation(avgTemperature)
          }
        }
      }

      const baseScore = this.scoringService.scoreSector(sector, {
        userLocation,
        minGradeIndex,
        maxGradeIndex,
        orientationPreference,
      })

      // === ANALYZE CONDITIONS: Weather + Seasonality + Orientation ===
      const currentMonth = new Date().getMonth() + 1 // 1-12
      let weatherScore = 50 // neutral default
      let seasonalityScore = 50 // neutral default
      let orientationBonus = 0
      const conditionsReasons: string[] = []
      let isGoodDay = true

      // 1. Analyze seasonality from TheCrag historical data
      if (sector.seasonality && Array.isArray(sector.seasonality)) {
        const seasonalityAnalysis = this.conditionsService.analyzeSeasonality(
          sector.seasonality,
          currentMonth,
        )
        seasonalityScore = seasonalityAnalysis.score
        if (seasonalityAnalysis.reason) {
          conditionsReasons.push(seasonalityAnalysis.reason)
        }
      }

      // 2. Analyze real-time weather conditions
      if (sectorWeatherForecast && sectorWeatherForecast.length > 0) {
        const tomorrowForecast = sectorWeatherForecast[0]

        const weatherAnalysis = this.conditionsService.analyzeConditions(
          tomorrowForecast,
          orientationPreference,
          sector.orientation as string | null,
        )

        weatherScore = weatherAnalysis.score
        isGoodDay = weatherAnalysis.isGoodDay
        conditionsReasons.push(...weatherAnalysis.reasons)

        // 3. Orientation bonus based on current weather
        if (sector.orientation) {
          const orientation = String(sector.orientation).toUpperCase()

          // Hot weather (> 25°C): prefer N, NE, NW
          if (orientationPreference === 'shade') {
            if (orientation.includes('N') && !orientation.includes('S')) {
              orientationBonus = 10
              conditionsReasons.push('⭐ Perfect orientation for hot weather')
            } else if (
              orientation.includes('E') &&
              !orientation.includes('S')
            ) {
              orientationBonus = 5
            }
          }

          // Cold weather (< 15°C): prefer S, SE, SW
          if (orientationPreference === 'sun') {
            if (orientation.includes('S') && !orientation.includes('N')) {
              orientationBonus = 10
              conditionsReasons.push('⭐ Perfect orientation for cold weather')
            } else if (
              (orientation.includes('E') || orientation.includes('W')) &&
              !orientation.includes('N')
            ) {
              orientationBonus = 5
            }
          }
        }
      }

      // 4. Calculate combined conditions score
      // Weights: 50% weather, 30% seasonality, 20% orientation bonus
      const combinedConditionsScore =
        weatherScore * 0.5 +
        seasonalityScore * 0.3 +
        (orientationBonus / 10) * 100 * 0.2

      // 5. Adjust relevance score with conditions bonus
      // Add up to 20 points based on combined conditions
      const conditionsBonus = (combinedConditionsScore / 100) * 20
      const adjustedRelevanceScore =
        baseScore.relevanceScore + conditionsBonus

      // Extract crag name from urlAncestorStub
      const cragName = sector.urlAncestorStub
        ? sector.urlAncestorStub.split('/').pop() || sector.urlAncestorStub
        : null

      // Get coordinates
      const coordinates =
        sector.latitude !== null && sector.longitude !== null
          ? { lat: sector.latitude, lon: sector.longitude }
          : null

      // Build sector object with routes, cragName, and coordinates
      const enrichedSector = {
        ...baseScore.sector,
        cragName,
        coordinates,
        routes: routesInRange, // Routes filtered to user's grade range
      }

      // Build conditions object (always include if we have any data)
      const hasConditionsData =
        sectorWeatherForecast ||
        (sector.seasonality && Array.isArray(sector.seasonality))

      return {
        sector: enrichedSector,
        cragInfo, // Keep crag info for grouping
        sectorWeatherForecast, // Keep for metadata
        distance: baseScore.distance,
        routesInUserRange: routesInRange.length, // Use actual filtered routes count instead of gradeDistribution
        matchReasons: baseScore.matchReasons,
        scoringBreakdown: baseScore.scoringBreakdown,
        relevanceScore: Math.min(100, adjustedRelevanceScore), // Cap at 100
        conditions: hasConditionsData
          ? {
              weatherScore,
              seasonalityScore,
              orientationBonus,
              combinedScore: Math.round(combinedConditionsScore),
              reasons: conditionsReasons,
              isGoodDay,
            }
          : undefined,
      }
    })

    // 9. Sort by relevance score (descending) - ahora incluye clima
    scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore)

    // 10. Group by crag/school
    const cragGroups = new Map<string, any[]>()

    for (const result of scoredResults) {
      const cragId = result.cragInfo?.id || 'unknown'
      if (!cragGroups.has(cragId)) {
        cragGroups.set(cragId, [])
      }
      cragGroups.get(cragId)!.push(result)
    }

    // 10.5. Get total sector counts for all crags
    const cragIdStrings = Array.from(cragGroups.keys()).filter((id) => id !== 'unknown')
    const cragIds = cragIdStrings.map((id) => CragId.fromString(id))
    const sectorCounts = await this.sectorRepository.getSectorCountsByCragIds(cragIds)

    // 11. Build crag-grouped results
    const groupedResults = Array.from(cragGroups.entries()).map(
      ([cragId, sectors]) => {
        const firstSector = sectors[0]
        const crag = firstSector.cragInfo

        // Remove internal fields from individual sectors (not needed in response)
        const cleanedSectors = sectors.map(
          ({ cragInfo, sectorWeatherForecast, ...sector }) => sector,
        )

        return {
          crag: crag!,
          sectors: cleanedSectors,
          avgRelevanceScore:
            sectors.reduce((sum, s) => sum + s.relevanceScore, 0) /
            sectors.length,
          totalRoutesInRange: sectors.reduce(
            (sum, s) => sum + s.routesInUserRange,
            0,
          ),
          distance: Math.min(...sectors.map((s) => s.distance)),
          totalSectorsInCrag: sectorCounts.get(cragId) || sectors.length,
        }
      },
    )

    // Sort crags by average relevance score
    groupedResults.sort((a, b) => b.avgRelevanceScore - a.avgRelevanceScore)

    // 12. Apply pagination to crags (not individual sectors)
    const paginatedCrags = groupedResults.slice(offset, offset + limit)

    // 13. Calculate search time
    const searchTime = Date.now() - startTime
    const totalSectors = scoredResults.length

    // 14. Calculate global route totals
    // Total routes = sum of all routes across all sectors (regardless of grade)
    const totalRoutes = candidates.reduce(
      (sum, sectorWithRoutes) => sum + sectorWithRoutes.routes.length,
      0,
    )

    // Total routes in range = sum of routesInUserRange across all scored results
    const totalRoutesInRange = scoredResults.reduce(
      (sum, result) => sum + result.routesInUserRange,
      0,
    )

    // Get representative weather from first result (if available)
    const firstResultWithWeather = scoredResults.find(
      (r) => r.sectorWeatherForecast && r.sectorWeatherForecast.length > 0,
    )
    const representativeWeather = firstResultWithWeather?.sectorWeatherForecast

    return {
      results: paginatedCrags,
      total: groupedResults.length, // Total number of crags
      totalSectors, // Total number of individual sectors
      totalRoutes, // Total routes across all sectors
      totalRoutesInRange, // Total routes in user's grade range
      filters: dto,
      metadata: {
        searchTime,
        preferredOrientation: baseOrientationPreference,
        weatherLocationsQueried: weatherCache.size,
        weather: representativeWeather
          ? {
              temperature:
                Math.round(representativeWeather[0].temperature.mean * 10) / 10,
              conditions: this.getWeatherDescription(representativeWeather[0]),
              isGoodForClimbing:
                representativeWeather[0].precipitation.amount < 5 &&
                representativeWeather[0].wind.mean < 25,
            }
          : undefined,
      },
    }
  }

  private getWeatherDescription(forecast: DailyForecast): string {
    const temp = forecast.temperature.mean
    const precip = forecast.precipitation.amount
    const wind = forecast.wind.mean

    if (precip > 5) return 'Rain'
    if (wind > 30) return 'Strong wind'
    if (temp > 30) return 'Very hot'
    if (temp < 10) return 'Cold'
    if (temp >= 20 && temp <= 28 && precip < 1) return 'Ideal'
    return 'Good'
  }

  /**
   * Calculate geographic bounding box for initial filtering
   * Uses approximation: 1 degree latitude ≈ 111km, longitude varies by latitude
   */
  private calculateGeographicBounds(
    center: Coordinates,
    radiusKm: number,
  ): { latMin: number; latMax: number; lonMin: number; lonMax: number } {
    const latDelta = radiusKm / 111
    const lonDelta =
      radiusKm / (111 * Math.cos((center.latitude * Math.PI) / 180))

    return {
      latMin: center.latitude - latDelta,
      latMax: center.latitude + latDelta,
      lonMin: center.longitude - lonDelta,
      lonMax: center.longitude + lonDelta,
    }
  }
}
