import { Inject, Injectable, OneJsError } from '@OneJs/core'
import { AreaId } from '@area/domain/value-objects/area-id.vo'
import { AreaPrismaRepository } from '@area/infrastructure/persistence/prisma/area.repository'
import { SectorPrismaRepository } from '@sector/infrastructure/persistence/prisma/sector.repository'
import { RoutePrismaRepository } from '@route/infrastructure/persistence/prisma/route.repository'

/**
 * Sector summary for area detail view
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
  gradeDistribution: Record<string, number>
  avgStars: number | null
  // Tags
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
 * Complete area detail response
 */
export interface AreaDetailResponse {
  // Basic info
  id: string
  name: string
  type: string
  description: string | null
  approach: string | null
  cragId: string
  parentAreaId: string | null
  latitude: number | null
  longitude: number | null

  // Stats
  totalSectors: number
  totalRoutes: number

  // Sectors with stats for client-side filtering
  sectors: SectorSummary[]

  // Top routes (by stars/ascents)
  topRoutes: RouteHighlight[]

  // Best seasons
  bestSeasons: number[]
}

@Injectable()
export class GetAreaDetailUseCase {
  constructor(
    @Inject(AreaPrismaRepository)
    private readonly areaRepo: AreaPrismaRepository,
    @Inject(SectorPrismaRepository)
    private readonly sectorRepo: SectorPrismaRepository,
    @Inject(RoutePrismaRepository)
    private readonly routeRepo: RoutePrismaRepository,
  ) {}

  /**
   * Get detailed area information with its sectors
   */
  async execute(areaId: string): Promise<AreaDetailResponse> {
    // 1. Get area from repository
    const area = await this.areaRepo.findById(AreaId.fromString(areaId))

    if (!area) {
      throw new OneJsError('Area not found', 404, 'AREA_NOT_FOUND')
    }

    // 2. Get all sectors for this area
    const sectors = await this.sectorRepo.findByAreaId(area.id)

    // 3. Get sector IDs for route query
    const sectorIds = sectors.map((s) => s.id)

    // 4. Count actual routes per sector
    const routeCountMap =
      await this.sectorRepo.getRouteCountsBySectorIds(sectorIds)

    // 5. Build sector summaries
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
        headerImageUrl: sector.getHeaderImageUrl('mobile'),
        gradeDistribution: sector.stats.gradeDistribution || {},
        avgStars: sector.stats.avgStars || null,
        // Tags
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

    // 6. Get top routes
    const routeHighlights: RouteHighlight[] =
      await this.routeRepo.findTopRoutesBySectorIds(sectorIds, 15)

    // 7. Calculate total routes
    const totalRoutes = sectorSummaries.reduce(
      (sum, s) => sum + s.routeCount,
      0,
    )

    // 8. Build response
    return {
      id: area.id.toString(),
      name: area.name.toString(),
      type: area.type,
      description: area.beta.getDescription(),
      approach: area.beta.getApproach(),
      cragId: area.cragId.toString(),
      parentAreaId: area.parentAreaId?.toString() ?? null,
      latitude: area.latitude,
      longitude: area.longitude,
      totalSectors: sectors.length,
      totalRoutes,
      sectors: sectorSummaries,
      topRoutes: routeHighlights,
      bestSeasons: area.seasonality.toArray(),
    }
  }
}
