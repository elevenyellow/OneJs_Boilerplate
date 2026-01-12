import { TopoPrismaRepository } from '@climb-zone/topo'
import { CragId } from '@crag/domain/value-objects/crag-id.vo'
import { CragPrismaRepository } from '@crag/infrastructure/persistence/prisma/crag.repository'
import { Inject, Injectable, OneJsError } from '@OneJs/core'
import { RoutePrismaRepository } from '@route/infrastructure/persistence/prisma/route.repository'
import { SectorPrismaRepository } from '@sector/infrastructure/persistence/prisma/sector.repository'
import { AreaPrismaRepository } from '@area/infrastructure/persistence/prisma/area.repository'
import { WeatherService } from '@weather'
import type {
  DailyForecast,
  HourlyForecast,
} from '@weather/domain/entities/weather-response.entity'

/**
 * Area summary for crag detail view
 */
export interface AreaSummary {
  id: string
  name: string
  type: string
  parentAreaId: string | null
  sectorCount: number
  routeCount: number
  description: string | null
  latitude: number | null
  longitude: number | null
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

  // Crag overview topos (showing areas/sectors)
  topoImages: CragTopoImage[]

  // Areas (geographic zones) - this is the first level of navigation
  areas: AreaSummary[]

  // Top routes (by stars/ascents) across all areas
  topRoutes: RouteHighlight[]

  // Best seasons
  bestSeasons: number[]
}

@Injectable()
export class GetCragDetailUseCase {
  constructor(
    @Inject(CragPrismaRepository)
    private readonly cragRepo: CragPrismaRepository,
    @Inject(AreaPrismaRepository)
    private readonly areaRepo: AreaPrismaRepository,
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
   * Get detailed crag information with areas (first level of navigation)
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

    // 2. Get root areas for this crag (first level of navigation)
    const areas = await this.areaRepo.findRootAreasByCragId(crag.id)

    // 3. Get all sectors for this crag (for stats and top routes)
    const sectors = await this.sectorRepo.findByCragId(crag.id)
    const sectorIds = sectors.map((s) => s.id)

    // 4. Count sectors per area
    const sectorsByArea = new Map<string, number>()
    for (const sector of sectors) {
      const areaId = sector.areaId.toString()
      sectorsByArea.set(areaId, (sectorsByArea.get(areaId) || 0) + 1)
    }

    // 5. Count routes per area
    const routesByArea = new Map<string, number>()
    for (const sector of sectors) {
      const areaId = sector.areaId.toString()
      const routeCount = sector.stats.routeCount || 0
      routesByArea.set(areaId, (routesByArea.get(areaId) || 0) + routeCount)
    }

    // 6. Build area summaries
    const areaSummaries: AreaSummary[] = areas.map((area) => {
      const areaId = area.id.toString()
      return {
        id: areaId,
        name: area.name.toString(),
        type: area.type,
        parentAreaId: area.parentAreaId?.toString() ?? null,
        sectorCount: sectorsByArea.get(areaId) || 0,
        routeCount: routesByArea.get(areaId) || 0,
        description: area.beta.getDescription(),
        latitude: area.latitude,
        longitude: area.longitude,
      }
    })

    // 7. Get top routes across all sectors
    const routeHighlights: RouteHighlight[] =
      await this.routeRepo.findTopRoutesBySectorIds(sectorIds, 15)

    // 8. Fetch weather forecast (7 days daily + hourly for first 2 days)
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

    // 9. Calculate total routes across all areas
    const totalRoutes = areaSummaries.reduce(
      (sum, a) => sum + a.routeCount,
      0,
    )

    // 10. Get crag topo images using TopoRepository
    const topoImages = await this.topoRepo.findCragToposWithPositions(crag.id)

    // 11. Build response
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
      areas: areaSummaries,
      topRoutes: routeHighlights,
      bestSeasons: crag.seasonality.toArray(),
    }
  }
}
