import { Inject, Injectable } from '@OneJs/core'
import { PrismaClientOneJs } from '@OneJs/prisma'
import { Coordinates, Grade } from '@climb-zone/shared'
import { ClimbingConditionsService } from '@sector/application/services/climbing-conditions.service'
import { SectorScoringService } from '@sector/application/services/sector-scoring.service'
import type {
  CragSectorResult,
  SearchCragResult,
  SearchCragsDto,
  SearchCragsResponse,
} from '@sector/domain/dtos/search-crags.dto'
import type { AdvancedSearchFilters } from '@sector/domain/dtos/search-sectors.dto'
import { SectorPrismaRepository } from '@sector/infrastructure/persistence/prisma/sector.repository'
import type { DailyForecast } from '@weather'
import { WeatherService } from '@weather'

/**
 * Use Case: Search crags (climbing areas) with sectors grouped together
 *
 * This is more practical than sector search because:
 * - Users typically go to a crag/area, not individual sectors
 * - Shows all available sectors in each climbing area
 * - Better overview of total routes available
 */
@Injectable()
export class SearchCragsUseCase {
  constructor(
    @Inject(SectorPrismaRepository)
    private readonly sectorRepository: SectorPrismaRepository,
    @Inject(SectorScoringService)
    private readonly scoringService: SectorScoringService,
    @Inject(ClimbingConditionsService)
    private readonly conditionsService: ClimbingConditionsService,
    @Inject(PrismaClientOneJs)
    private readonly prisma: PrismaClientOneJs,
    @Inject(WeatherService)
    private readonly weatherService: WeatherService,
  ) {}

  async execute(dto: SearchCragsDto): Promise<SearchCragsResponse> {
    const startTime = Date.now()

    // 1. Prepare search parameters
    const userLocation = new Coordinates(
      dto.userLocation.lat,
      dto.userLocation.lon,
    )
    const maxDistance = dto.maxDistance ?? 100
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

    // 3. Determine base orientation preference (will be refined based on weather)
    const orientationPreference: 'sun' | 'shade' | 'any' =
      dto.forceOrientation ?? 'any'

    // 4. Calculate geographic bounds
    const { latMin, latMax, lonMin, lonMax } = this.calculateGeographicBounds(
      userLocation,
      maxDistance,
    )

    // 5. Build advanced filters (fetch many candidates)
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
      limit: 1000, // Fetch all matching sectors for grouping
      offset: 0,
    }

    // 6. Fetch all candidate sectors
    const sectors =
      await this.sectorRepository.searchWithAdvancedFilters(advancedFilters)

    // 7. Score all sectors
    const scoredSectors = sectors.map((sector) => {
      return this.scoringService.scoreSector(sector, {
        userLocation,
        minGradeIndex,
        maxGradeIndex,
        orientationPreference,
      })
    })

    // 8. Group sectors by crag
    const sectorsByCrag = new Map<string, typeof scoredSectors>()

    for (const scoredSector of scoredSectors) {
      const areaId = scoredSector.sector.areaId

      // Get crag ID from area (we'll fetch this info later)
      if (!sectorsByCrag.has(areaId)) {
        sectorsByCrag.set(areaId, [])
      }
      sectorsByCrag.get(areaId)!.push(scoredSector)
    }

    // 9. Fetch area and crag information
    const areaIds = Array.from(sectorsByCrag.keys())
    const areas = await this.prisma.area.findMany({
      where: { id: { in: areaIds } },
      select: {
        id: true,
        cragId: true,
        crag: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
            urlStub: true,
            description: true,
            numberPhotos: true,
            numberTopos: true,
            hasTopo: true,
            totalFavorites: true,
            sourceUrl: true,
          },
        },
      },
    })

    // 10. Group by actual crags
    const sectorsByCragId = new Map<
      string,
      {
        crag: (typeof areas)[0]['crag']
        sectors: typeof scoredSectors
      }
    >()

    for (const area of areas) {
      const cragId = area.cragId
      const sectorsForArea = sectorsByCrag.get(area.id) || []

      if (!sectorsByCragId.has(cragId)) {
        sectorsByCragId.set(cragId, {
          crag: area.crag,
          sectors: [],
        })
      }

      sectorsByCragId.get(cragId)!.sectors.push(...sectorsForArea)
    }

    // 11. Build crag results with aggregated data
    const cragResults: SearchCragResult[] = []

    // Fetch weather data for the user's location (for next 3 days average)
    let weatherForecast: DailyForecast[] | null = null
    let avgTemperature: number | null = null
    let weatherBasedOrientation: 'sun' | 'shade' | 'any' = orientationPreference

    // Try to fetch weather if service is available
    if (this.weatherService) {
      try {
        const weatherData = await this.weatherService
          .getByCoordinates({
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          })
          .parsed()

        weatherForecast = weatherData.daily.slice(0, 3) // Next 3 days

        // Calculate average temperature
        avgTemperature =
          weatherForecast.reduce((sum, day) => sum + day.temperature.mean, 0) /
          weatherForecast.length

        // Override orientation based on actual weather
        weatherBasedOrientation =
          this.conditionsService.getPreferredOrientation(avgTemperature)

        console.log(
          `✅ Weather data fetched: ${avgTemperature.toFixed(1)}°C avg, orientation: ${weatherBasedOrientation}`,
        )
      } catch (error) {
        // If weather API fails, continue without weather data
        console.warn(
          '⚠️ Failed to fetch weather data, continuing with seasonality only:',
          error,
        )
      }
    } else {
      console.log('ℹ️ WeatherService not available, using seasonality only')
    }

    for (const [
      cragId,
      { crag, sectors: cragSectors },
    ] of sectorsByCragId.entries()) {
      // Calculate crag metrics
      const totalRoutesInUserRange = cragSectors.reduce(
        (sum, s) => sum + s.routesInUserRange,
        0,
      )

      const sectorScores = cragSectors.map((s) => s.relevanceScore)
      const bestSectorScore = Math.max(...sectorScores)
      const averageSectorScore =
        sectorScores.reduce((a, b) => a + b, 0) / sectorScores.length

      // Calculate distance to crag
      const cragCoords =
        crag.latitude && crag.longitude
          ? new Coordinates(crag.latitude, crag.longitude)
          : null

      const distance = cragCoords ? userLocation.distanceTo(cragCoords) : 999999

      // Build sector results
      const sectorResults: CragSectorResult[] = cragSectors.map((s) => ({
        sector: s.sector,
        routesInUserRange: s.routesInUserRange,
        relevanceScore: s.relevanceScore,
      }))

      // Sort sectors by relevance within the crag
      sectorResults.sort((a, b) => b.relevanceScore - a.relevanceScore)

      // === ANALYZE CONDITIONS: Weather + Seasonality + Orientation ===
      const currentMonth = new Date().getMonth() + 1 // 1-12
      let weatherScore = 50 // neutral default
      let seasonalityScore = 50 // neutral default
      let orientationBonus = 0
      const conditionsReasons: string[] = []
      let isGoodDay = true

      // Use best sector as representative of the crag
      const bestSector = cragSectors[0]

      // 1. Analyze seasonality from TheCrag historical data
      if (
        bestSector?.sector.seasonality &&
        Array.isArray(bestSector.sector.seasonality)
      ) {
        const seasonalityAnalysis = this.conditionsService.analyzeSeasonality(
          bestSector.sector.seasonality,
          currentMonth,
        )
        seasonalityScore = seasonalityAnalysis.score
        if (seasonalityAnalysis.reason) {
          conditionsReasons.push(seasonalityAnalysis.reason)
        }
      }

      // 2. Analyze real-time weather conditions
      if (weatherForecast && weatherForecast.length > 0) {
        const tomorrowForecast = weatherForecast[0]
        const dominantOrientation = bestSector?.sector.orientation || null

        const weatherAnalysis = this.conditionsService.analyzeConditions(
          tomorrowForecast,
          weatherBasedOrientation,
          dominantOrientation,
        )

        weatherScore = weatherAnalysis.score
        isGoodDay = weatherAnalysis.isGoodDay
        conditionsReasons.push(...weatherAnalysis.reasons)

        // 3. Orientation bonus based on current weather
        if (dominantOrientation) {
          const orientation = String(dominantOrientation).toUpperCase()
          if (weatherBasedOrientation === 'shade') {
            if (orientation.includes('N') && !orientation.includes('S')) {
              orientationBonus = 10
              conditionsReasons.push('⭐ Perfect orientation for hot weather')
            } else if (orientation.includes('E') && !orientation.includes('S')) {
              orientationBonus = 5
            }
          } else if (weatherBasedOrientation === 'sun') {
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

      // Calculate overall crag relevance score
      // COMPONENTS:
      // 1. Base score from best sector (20%)
      // 2. Average sector score (5%)
      // 3. Route count in range (50% - MAIN WEIGHT)
      // 4. Conditions bonus (25% - weather + seasonality + orientation)
      //
      // Route score scales logarithmically:
      // - 10 routes = ~30 points
      // - 50 routes = ~50 points
      // - 100 routes = ~60 points (max)
      const routeScore = Math.min(
        Math.log10(totalRoutesInUserRange + 1) * 30,
        50,
      )
      const baseRelevance =
        bestSectorScore * 0.2 + averageSectorScore * 0.05 + routeScore
      const conditionsBonus = (combinedConditionsScore / 100) * 25 // 0-25 points
      const relevanceScore = baseRelevance + conditionsBonus

      // Build match reasons
      const matchReasons: string[] = []

      if (distance < 10) {
        matchReasons.push(`Muy cerca (${Math.round(distance)}km)`)
      } else if (distance < 30) {
        matchReasons.push(`A ${Math.round(distance)}km de distancia`)
      } else {
        matchReasons.push(`A ${Math.round(distance)}km de distancia`)
      }

      matchReasons.push(`${cragSectors.length} sectores disponibles`)
      matchReasons.push(`${totalRoutesInUserRange} rutas en tu rango de grado`)

      if (crag.hasTopo) {
        matchReasons.push('Tiene topos/croquis')
      }

      if (crag.totalFavorites && crag.totalFavorites > 20) {
        matchReasons.push(`Popular (${crag.totalFavorites} favoritos)`)
      }

      cragResults.push({
        crag: {
          id: crag.id,
          name: crag.name,
          latitude: crag.latitude,
          longitude: crag.longitude,
          urlStub: crag.urlStub,
          theCragUrl: crag.sourceUrl,
          description: crag.description,
          numberPhotos: crag.numberPhotos,
          numberTopos: crag.numberTopos,
          hasTopo: crag.hasTopo,
          totalFavorites: crag.totalFavorites,
        },
        distance,
        totalSectors: cragSectors.length,
        totalRoutesInUserRange,
        bestSectorScore,
        averageSectorScore,
        sectors: sectorResults,
        relevanceScore,
        matchReasons,
        conditions:
          weatherForecast ||
          (bestSector?.sector.seasonality &&
            Array.isArray(bestSector.sector.seasonality))
            ? {
                weatherScore,
                seasonalityScore,
                orientationBonus,
                combinedScore: Math.round(combinedConditionsScore),
                reasons: conditionsReasons,
                isGoodDay,
              }
            : undefined,
      })
    }

    // 12. Sort crags by relevance score
    cragResults.sort((a, b) => b.relevanceScore - a.relevanceScore)

    // 13. Apply pagination
    const paginatedResults = cragResults.slice(offset, offset + limit)

    // 14. Calculate metadata
    const searchTime = Date.now() - startTime
    const totalSectorsFound = scoredSectors.length
    const totalRoutesInRange = cragResults.reduce(
      (sum, c) => sum + c.totalRoutesInUserRange,
      0,
    )

    return {
      results: paginatedResults,
      total: cragResults.length,
      filters: dto,
      metadata: {
        searchTime,
        preferredOrientation: weatherBasedOrientation, // Usar orientación basada en clima real
        totalSectorsFound,
        totalRoutesInRange,
        weather:
          avgTemperature !== null && weatherForecast
            ? {
                temperature: Math.round(avgTemperature * 10) / 10,
                conditions: this.getWeatherDescription(weatherForecast[0]),
                isGoodForClimbing:
                  weatherForecast[0].precipitation.amount < 5 &&
                  weatherForecast[0].wind.mean < 25,
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
