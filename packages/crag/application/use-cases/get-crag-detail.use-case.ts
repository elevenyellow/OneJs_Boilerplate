import { CragId } from '@crag/domain/value-objects/crag-id.vo'
import { CragPrismaRepository } from '@crag/infrastructure/persistence/prisma/crag.repository'
import { Inject, Injectable, OneJsError } from '@OneJs/core'
import { SectorPrismaRepository } from '@sector/infrastructure/persistence/prisma/sector.repository'
import { RoutePrismaRepository } from '@route/infrastructure/persistence/prisma/route.repository'
import { TopoPrismaRepository } from '@climb-zone/topo'
import { WeatherService } from '@weather'
import type {
  DailyForecast,
  HourlyForecast,
} from '@weather/domain/entities/weather-response.entity'

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
  // Tags for filtering and display
  kidFriendly: boolean | null
  beginner: boolean | null
  dogFriendly: boolean | null
  accessible: boolean | null
  camping: boolean | null
  swimming: boolean | null
  scenic: boolean | null
  popular: boolean | null
  quiet: boolean | null
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
 * Sector position on a crag topo image
 */
export interface CragTopoSectorPosition {
  sectorId: string | null
  areaNumber: string
  areaName: string
  points: string
  externalAreaId: number | null
  areaUrl: string | null
}

/**
 * Crag overview topo image with sector positions
 */
export interface CragTopoImage {
  id: string
  externalId: string
  thumbnailUrl: string
  fullImageUrl: string
  width: number
  height: number
  originalWidth: number
  originalHeight: number
  viewScale: number
  sectorPositions: CragTopoSectorPosition[]
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

  // Crag overview topos (showing sectors)
  topoImages: CragTopoImage[]

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
    @Inject(CragPrismaRepository)
    private readonly cragRepo: CragPrismaRepository,
    @Inject(SectorPrismaRepository)
    private readonly sectorRepo: SectorPrismaRepository,
    @Inject(RoutePrismaRepository)
    private readonly routeRepo: RoutePrismaRepository,
    @Inject(TopoPrismaRepository)
    private readonly topoRepo: TopoPrismaRepository,
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
    // 1. Get crag with country/region info from repository
    const cragData = await this.cragRepo.findByIdWithLocation(
      CragId.fromString(cragId),
    )

    if (!cragData) {
      throw new OneJsError('Crag not found', 404, 'CRAG_NOT_FOUND')
    }

    const { crag, countryName, regionName, averageHeight } = cragData

    // 2. Get all sectors for this crag using SectorRepository
    const sectors = await this.sectorRepo.findByCragId(crag.id)

    // 3. Get sector IDs for route query
    const sectorIds = sectors.map((s) => s.id)

    // 4. Count actual routes per sector (in case routeCount is not updated)
    const routeCountMap = await this.sectorRepo.getRouteCountsBySectorIds(
      sectorIds,
    )

    // 5. Build sector summaries
    // Client will calculate routesInRange and scoring using gradeDistribution
    const sectorSummaries: SectorSummary[] = sectors.map((sector) => {
      const actualRouteCount =
        routeCountMap.get(sector.id.toString()) || sector.stats.routeCount || 0

      return {
        id: sector.id.toString(),
        name: sector.name.toString(),
        orientation: sector.orientation?.toString() ?? null,
        rockType: sector.rockType?.toString() ?? null,
        sunExposure: sector.sunExposure?.toString() ?? null,
        routeCount: actualRouteCount,
        minGrade: sector.stats.minGrade,
        maxGrade: sector.stats.maxGrade,
        avgGrade: sector.stats.avgGrade || null,
        avgHeight: sector.stats.averageHeight,
        maxHeight: sector.stats.maxHeight || null,
        totalFavorites: sector.totalFavorites,
        hasTopo: sector.hasTopo,
        theCragUrl: sector.urlStub
          ? `https://www.thecrag.com${sector.urlStub}`
          : null,
        headerImageUrl: sector.headerImageS3Url ?? sector.headerImageUrl,
        gradeDistribution: sector.stats.gradeDistribution || {},
        avgStars: sector.stats.avgStars || null,
        // Tags for filtering and display
        kidFriendly: sector.kidFriendly,
        beginner: sector.beginner,
        dogFriendly: sector.dogFriendly,
        accessible: sector.accessible,
        camping: sector.camping,
        swimming: sector.swimming,
        scenic: sector.scenic,
        popular: sector.popular,
        quiet: sector.quiet,
      }
    })

    // 6. Get top routes using RouteRepository
    const routeHighlights: RouteHighlight[] =
      await this.routeRepo.findTopRoutesBySectorIds(sectorIds, 15)

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
    const totalRoutes = sectorSummaries.reduce(
      (sum, s) => sum + s.routeCount,
      0,
    )

    // 9. Get crag topo images using TopoRepository
    const topoImages = await this.topoRepo.findCragToposWithPositions(crag.id)

    // 10. Build response
    return {
      id: crag.id.toString(),
      name: crag.name.toString(),
      description: crag.description,
      approach: crag.approach,
      country: countryName,
      region: regionName,
      latitude: crag.latitude,
      longitude: crag.longitude,
      altitude: averageHeight,
      totalSectors: sectors.length,
      totalRoutes,
      totalFavorites: crag.totalFavorites,
      numberPhotos: crag.numberPhotos,
      numberTopos: crag.numberTopos,
      hasTopo: crag.hasTopo,
      theCragUrl: crag.getTheCragUrl() ?? crag.sourceUrl.toString(),
      headerImageUrl: crag.getHeaderImageUrl('mobile'),
      forecast,
      hourlyForecast,
      topoImages,
      sectors: sectorSummaries,
      topRoutes: routeHighlights,
      bestSeasons: crag.seasonality.toArray(),
    }
  }
}
