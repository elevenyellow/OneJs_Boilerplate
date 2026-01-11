import { Inject, Injectable, OneJsError } from '@OneJs/core'
import { PrismaClientOneJs } from '@OneJs/prisma'
import { Grade } from '@climb-zone/shared'
import { WeatherService } from '@weather'
import type { DailyForecast, HourlyForecast } from '@weather/domain/entities/weather-response.entity'

/**
 * Sector summary for crag detail view
 */
export interface SectorSummary {
  id: string
  name: string
  orientation: string | null
  rockType: string | null
  sunExposure: string | null
  routeCount: number
  routesInGradeRange: number
  minGrade: string | null
  maxGrade: string | null
  avgGrade: string | null // Average grade
  avgHeight: number | null // Average height of routes
  maxHeight: number | null // Maximum height of routes
  totalFavorites: number | null
  hasTopo: boolean
  theCragUrl: string | null
  headerImageUrl: string | null // Sector header image
  score: number // Calculated relevance score
}

/**
 * Route highlight for top routes section
 */
export interface RouteHighlight {
  id: string
  name: string
  grade: string | null
  gradeIndex: number | null
  stars: number | null
  ascents: number | null
  height: number | null
  routeType: string | null
  sectorId: string
  sectorName: string
}

/**
 * Complete crag detail response
 */
export interface CragDetailResponse {
  // Basic info
  id: string
  name: string
  description: string | null
  approach: string | null
  country: string
  region: string | null
  latitude: number | null
  longitude: number | null
  altitude: number | null
  
  // Stats
  totalSectors: number
  totalRoutes: number
  totalRoutesInRange: number
  totalFavorites: number | null
  numberPhotos: number | null
  numberTopos: number | null
  hasTopo: boolean
  theCragUrl: string | null
  headerImageUrl: string | null
  
  // Weather forecast (7 days daily + hourly for first 2 days)
  forecast: DailyForecast[] | null
  hourlyForecast: HourlyForecast[] | null
  
  // Recommended sectors
  sectors: SectorSummary[]
  
  // Top routes
  topRoutes: RouteHighlight[]
  
  // Best seasons
  bestSeasons: number[]
}

@Injectable()
export class GetCragDetailUseCase {
  constructor(
    @Inject(PrismaClientOneJs)
    private readonly prisma: PrismaClientOneJs,
    @Inject(WeatherService)
    private readonly weatherService: WeatherService,
  ) {}

  async execute(
    cragId: string,
    gradeRange?: { min: string; max: string },
  ): Promise<CragDetailResponse> {
    // 1. Get crag with country/region info
    const crag = await this.prisma.crag.findUnique({
      where: { id: cragId },
      include: {
        country: { select: { name: true } },
        region: { select: { name: true } },
      },
    })

    if (!crag) {
      throw new OneJsError('Crag not found', 404, 'CRAG_NOT_FOUND')
    }

    // 2. Calculate grade indices if provided
    const minGradeIndex = gradeRange
      ? Grade.calculateIndexFromString(gradeRange.min)
      : null
    const maxGradeIndex = gradeRange
      ? Grade.calculateIndexFromString(gradeRange.max)
      : null

    // 3. Get all sectors for this crag (through areas)
    const sectors = await this.prisma.sector.findMany({
      where: {
        area: {
          cragId: cragId,
        },
      },
      orderBy: [
        { totalFavorites: 'desc' },
        { routeCount: 'desc' },
      ],
    })

    // 4. Get sector IDs for route query
    const sectorIds = sectors.map(s => s.id)

    // 5. Count actual routes per sector (in case routeCount is not updated)
    const routeCountsBySector = await this.prisma.route.groupBy({
      by: ['sectorId'],
      where: {
        sectorId: { in: sectorIds },
      },
      _count: { id: true },
    })
    const routeCountMap = new Map(
      routeCountsBySector.map(r => [r.sectorId, r._count.id])
    )

    // 6. Build sector summaries with routes in grade range
    // OPTIMIZATION: Use gradeDistribution from sector stats instead of querying routes
    const sectorSummaries: SectorSummary[] = sectors.map((sector) => {
      // Get actual route count from database or use stored routeCount
      const actualRouteCount = routeCountMap.get(sector.id) || sector.routeCount || 0
      
      // Count routes in grade range using stored gradeDistribution
      let routesInGradeRange = actualRouteCount
      
      if (minGradeIndex !== null && maxGradeIndex !== null) {
        routesInGradeRange = this.countRoutesInRangeFromDistribution(
          sector.gradeDistribution as Record<string, number> | null,
          minGradeIndex,
          maxGradeIndex
        )
      }

      // Calculate a simple relevance score
      const score = this.calculateSectorScore(
        { ...sector, routeCount: actualRouteCount },
        routesInGradeRange
      )

      return {
        id: sector.id,
        name: sector.name,
        orientation: sector.orientation,
        rockType: sector.rockType,
        sunExposure: sector.sunExposure,
        routeCount: actualRouteCount,
        routesInGradeRange,
        minGrade: sector.minGrade,
        maxGrade: sector.maxGrade,
        avgGrade: sector.avgGrade || null,
        avgHeight: sector.averageHeight,
        maxHeight: sector.maxHeight || null,
        totalFavorites: sector.totalFavorites,
        hasTopo: sector.hasTopo,
        theCragUrl: sector.urlStub
          ? `https://www.thecrag.com${sector.urlStub}`
          : null,
        headerImageUrl: sector.headerImageUrl,
        score,
      }
    })

    // Sort by score (descending)
    sectorSummaries.sort((a, b) => b.score - a.score)

    // 6. Get top routes across all sectors
    const routesQuery: Record<string, unknown> = {
      sectorId: { in: sectorIds },
    }

    // Add grade filter if provided
    if (minGradeIndex !== null && maxGradeIndex !== null) {
      routesQuery.gradeIndex = {
        gte: minGradeIndex,
        lte: maxGradeIndex,
      }
    }

    const topRoutes = await this.prisma.route.findMany({
      where: routesQuery,
      orderBy: [
        { stars: 'desc' },
        { ascents: 'desc' },
      ],
      take: 15,
      include: {
        sector: {
          select: { name: true },
        },
      },
    })

    const routeHighlights: RouteHighlight[] = topRoutes.map((route) => ({
      id: route.id,
      name: route.name,
      grade: route.grade,
      gradeIndex: route.gradeIndex,
      stars: route.stars,
      ascents: route.ascents,
      height: route.height,
      routeType: route.subType,
      sectorId: route.sectorId,
      sectorName: route.sector.name,
    }))

    // 7. Fetch weather forecast (7 days daily + hourly for first 2 days)
    let forecast: DailyForecast[] | null = null
    let hourlyForecast: HourlyForecast[] | null = null

    if (crag.latitude && crag.longitude) {
      try {
        const weatherData = await this.weatherService
          .getByCoordinates({
            latitude: crag.latitude,
            longitude: crag.longitude,
          })
          .parsed()

        forecast = weatherData.daily.slice(0, 7)
        // Include hourly forecast for the first 48 hours (2 days)
        hourlyForecast = weatherData.hourly?.slice(0, 48) || null
      } catch (error) {
        console.warn('Failed to fetch weather for crag:', error)
        // Continue without weather data
      }
    }

    // 9. Calculate total routes from actual counts
    const totalRoutes = sectorSummaries.reduce((sum, s) => sum + s.routeCount, 0)
    
    // 10. Calculate total routes in grade range
    const totalRoutesInRange = sectorSummaries.reduce((sum, s) => sum + s.routesInGradeRange, 0)

    // 9. Build response
    return {
      id: crag.id,
      name: crag.name,
      description: crag.description,
      approach: crag.approach,
      country: crag.country.name,
      region: crag.region?.name || null,
      latitude: crag.latitude,
      longitude: crag.longitude,
      altitude: crag.averageHeight,
      totalSectors: sectors.length,
      totalRoutes,
      totalRoutesInRange,
      totalFavorites: crag.totalFavorites,
      numberPhotos: crag.numberPhotos,
      numberTopos: crag.numberTopos,
      hasTopo: crag.hasTopo,
      theCragUrl: crag.urlStub
        ? `https://www.thecrag.com${crag.urlStub}`
        : crag.sourceUrl,
      headerImageUrl: crag.headerImageUrl,
      forecast,
      hourlyForecast,
      sectors: sectorSummaries,
      topRoutes: routeHighlights,
      bestSeasons: crag.seasonality || [],
    }
  }

  private calculateSectorScore(
    sector: {
      routeCount: number | null
      totalFavorites: number | null
      hasTopo: boolean
      numberPhotos: number | null
    },
    routesInGradeRange: number,
  ): number {
    let score = 0

    // Routes in grade range (0-40 points)
    score += Math.min(routesInGradeRange * 4, 40)

    // Total routes (0-20 points)
    score += Math.min((sector.routeCount || 0) * 0.5, 20)

    // Popularity (0-20 points)
    score += Math.min((sector.totalFavorites || 0) * 0.5, 20)

    // Has topo (+10 points)
    if (sector.hasTopo) {
      score += 10
    }

    // Has photos (+10 points)
    if (sector.numberPhotos && sector.numberPhotos > 0) {
      score += 10
    }

    return Math.round(score)
  }

  /**
   * Count routes in grade range using stored gradeDistribution
   * This is O(n) where n is number of unique grades, much faster than DB query
   */
  private countRoutesInRangeFromDistribution(
    gradeDistribution: Record<string, number> | null,
    minGradeIndex: number,
    maxGradeIndex: number,
  ): number {
    if (!gradeDistribution || typeof gradeDistribution !== 'object') {
      return 0
    }

    let count = 0
    for (const [gradeStr, routeCount] of Object.entries(gradeDistribution)) {
      const gradeIndex = Grade.calculateIndexFromString(gradeStr)
      if (
        gradeIndex !== null &&
        gradeIndex >= minGradeIndex &&
        gradeIndex <= maxGradeIndex
      ) {
        count += routeCount as number
      }
    }

    return count
  }
}
