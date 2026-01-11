import { Inject, Injectable, OneJsError } from '@OneJs/core'
import { PrismaClientOneJs } from '@OneJs/prisma'
import { WeatherService } from '@weather'
import type { DailyForecast, HourlyForecast } from '@weather/domain/entities/weather-response.entity'

/**
 * Sector summary for crag detail view
 * Note: Grade filtering and scoring are done client-side using gradeDistribution
 */
export interface SectorSummary {
  id: string
  name: string
  orientation: string | null
  rockType: string | null
  sunExposure: string | null
  routeCount: number
  minGrade: string | null
  maxGrade: string | null
  avgGrade: string | null
  avgHeight: number | null
  maxHeight: number | null
  totalFavorites: number | null
  hasTopo: boolean
  theCragUrl: string | null
  headerImageUrl: string | null
  // Stats for client-side grade filtering and scoring
  gradeDistribution: Record<string, number>
  avgStars: number | null
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
  totalFavorites: number | null
  numberPhotos: number | null
  numberTopos: number | null
  hasTopo: boolean
  theCragUrl: string | null
  headerImageUrl: string | null
  
  // Weather forecast (7 days daily + hourly for first 2 days)
  forecast: DailyForecast[] | null
  hourlyForecast: HourlyForecast[] | null
  
  // Sectors with stats for client-side filtering
  sectors: SectorSummary[]
  
  // Top routes (by stars/ascents)
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

  /**
   * Get detailed crag information.
   * 
   * Note: Grade filtering and scoring are done client-side.
   * The server returns all sectors with their gradeDistribution,
   * allowing the client to calculate routesInRange without re-fetching.
   */
  async execute(cragId: string): Promise<CragDetailResponse> {
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

    // 2. Get all sectors for this crag (through areas)
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

    // 3. Get sector IDs for route query
    const sectorIds = sectors.map(s => s.id)

    // 4. Count actual routes per sector (in case routeCount is not updated)
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

    // 5. Build sector summaries
    // Client will calculate routesInRange and scoring using gradeDistribution
    const sectorSummaries: SectorSummary[] = sectors.map((sector) => {
      const actualRouteCount = routeCountMap.get(sector.id) || sector.routeCount || 0

      return {
        id: sector.id,
        name: sector.name,
        orientation: sector.orientation,
        rockType: sector.rockType,
        sunExposure: sector.sunExposure,
        routeCount: actualRouteCount,
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
        gradeDistribution: (sector.gradeDistribution as Record<string, number>) || {},
        avgStars: sector.avgStars || null,
      }
    })

    // 6. Get top routes across all sectors (sorted by quality)
    const topRoutes = await this.prisma.route.findMany({
      where: {
        sectorId: { in: sectorIds },
      },
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
        hourlyForecast = weatherData.hourly?.slice(0, 48) || null
      } catch (error) {
        console.warn('Failed to fetch weather for crag:', error)
      }
    }

    // 8. Calculate total routes
    const totalRoutes = sectorSummaries.reduce((sum, s) => sum + s.routeCount, 0)

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
}
