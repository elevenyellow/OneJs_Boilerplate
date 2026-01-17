import { ScrapedDataToCragMapper } from '@crags/application/mappers/scraped-data-to-crag.mapper'
import { CragStatsMapper } from '@crags/application/mappers/crag-stats.mapper'
import { CragPrismaRepository } from '@crags/infrastructure/persistence/prisma/crag.repository'
import { Inject, Injectable } from '@OneJs/core'
import { ScrapedDataToRouteMapper } from '@routes/application/mappers/scraped-data-to-route.mapper'
import { RoutePrismaRepository } from '@routes/infrastructure/persistence/prisma/route.repository'
import { ScrapedDataToSectorMapper } from '@sectors/application/mappers/scraped-data-to-sector.mapper'
import { SectorStatsMapper } from '@sectors/application/mappers/sector-stats.mapper'
import { SectorPrismaRepository } from '@sectors/infrastructure/persistence/prisma/sector.repository'
import { ScrapedDataToTopoMapper } from '@topos/application/mappers/scraped-data-to-topo.mapper'
import { TopoPrismaRepository } from '@topos/infrastructure/persistence/prisma/topo.repository'
import { ScrapedDataToZoneMapper } from '@zones/application/mappers/scraped-data-to-zone.mapper'
import { ZonePrismaRepository } from '@zones/infrastructure/persistence/prisma/zone.repository'
import type {
  ParentNode,
  ProcessedArea,
  ScrapedCrag,
  ScrapedRoute,
  TopoImageData,
} from '../../infrastructure/scraper/api.interfaces'
import { Scraper } from '../../infrastructure/scraper/Scraper'
import type { ScrapeResultDto } from '../dtos'
import { Id as CragId } from '@crags/domain/value-objects'
import { ZoneId } from '@zones/domain/value-objects'
import { Id as SectorId } from '@sectors/domain/value-objects'
import { ExternalId as SectorExternalId } from '@sectors/domain/value-objects'

interface ProcessAreasResult {
  sectorsCount: number
  routesCount: number
  toposCount: number
  /** IDs of sectors that were processed (for stats calculation) */
  sectorIds: SectorId[]
}

@Injectable()
export class ScrapeCragUseCase {
  constructor(
    @Inject(Scraper)
    private readonly scraper: Scraper,
    @Inject(ScrapedDataToZoneMapper)
    private readonly zoneMapper: ScrapedDataToZoneMapper,
    @Inject(ScrapedDataToCragMapper)
    private readonly cragMapper: ScrapedDataToCragMapper,
    @Inject(ScrapedDataToSectorMapper)
    private readonly sectorMapper: ScrapedDataToSectorMapper,
    @Inject(ScrapedDataToRouteMapper)
    private readonly routeMapper: ScrapedDataToRouteMapper,
    @Inject(ScrapedDataToTopoMapper)
    private readonly topoMapper: ScrapedDataToTopoMapper,
    @Inject(ZonePrismaRepository)
    private readonly zoneRepository: ZonePrismaRepository,
    @Inject(CragPrismaRepository)
    private readonly cragRepository: CragPrismaRepository,
    @Inject(SectorPrismaRepository)
    private readonly sectorRepository: SectorPrismaRepository,
    @Inject(RoutePrismaRepository)
    private readonly routeRepository: RoutePrismaRepository,
    @Inject(TopoPrismaRepository)
    private readonly topoRepository: TopoPrismaRepository,
  ) {}

  async execute(cragUrl: string): Promise<ScrapeResultDto> {
    const scrapedData = await this.scraper.execute(cragUrl)

    const { count: zonesCount, lastZoneId } = await this.processZones(
      scrapedData.parents ?? [],
    )

    if (!lastZoneId) {
      throw new Error('No zone found for crag. Parents chain is empty.')
    }

    const crag = await this.processCrag(scrapedData, lastZoneId)
    const cragId = crag.getId()

    const cragToposCount = await this.processCragTopos(scrapedData, cragId)

    const areasResult = await this.processAreasRecursively(
      scrapedData.areas ?? [],
      cragId,
      null,
      null,
    )

    const flatRoutesCount = await this.processFlatRoutes(
      scrapedData.routes ?? [],
      cragId,
    )

    // Calculate and update statistics for all sectors
    await this.calculateSectorStats(areasResult.sectorIds)

    // Calculate and update statistics for the crag
    await this.calculateCragStats(cragId)

    return {
      cragId: cragId.toString(),
      cragName: crag.getName().getValue(),
      zonesCount,
      sectorsCount: areasResult.sectorsCount,
      routesCount: areasResult.routesCount + flatRoutesCount,
      toposCount: areasResult.toposCount + cragToposCount,
    }
  }

  /**
   * Calculate and update statistics for all sectors
   */
  private async calculateSectorStats(sectorIds: SectorId[]): Promise<void> {
    for (const sectorId of sectorIds) {
      const routesData = await this.sectorRepository.getRoutesForStats(sectorId)

      if (routesData.length === 0) {
        continue
      }

      const statsFields = SectorStatsMapper.calculateFromRoutes(
        routesData.map((r) => ({
          gradeBand: r.gradeBand,
          stars: r.stars,
          qualityScore: r.qualityScore,
          ascents: r.ascents ?? r.ascentCount,
          popularity: r.popularity,
          height: r.height,
          pitches: r.pitches,
          bolts: r.bolts,
          hasTopo: r.hasTopo,
          isSport: r.isSport,
          isTrad: r.isTrad,
          isBoulder: r.isBoulder,
          isAid: r.isAid,
          isAlpine: r.isAlpine,
          isMixed: r.isMixed,
          isIce: r.isIce,
          isTopRope: r.isTopRope,
          name: r.name,
        })),
      )

      await this.sectorRepository.updateStats(sectorId, statsFields)
    }
  }

  /**
   * Calculate and update statistics for a crag
   */
  private async calculateCragStats(cragId: CragId): Promise<void> {
    const routesData = await this.cragRepository.getRoutesForStats(cragId)
    const sectorSummaries = await this.cragRepository.getSectorSummaries(cragId)

    if (routesData.length === 0) {
      return
    }

    const statsFields = CragStatsMapper.calculateFromRoutes(
      routesData,
      sectorSummaries,
    )

    await this.cragRepository.updateStats(cragId, statsFields)
  }

  private async processZones(
    parents: ParentNode[],
  ): Promise<{ count: number; lastZoneId: ZoneId | null }> {
    let previousZoneId: ZoneId | null = null

    for (const parent of parents) {
      const zone = await this.zoneMapper.mapFromScrapedData(
        parent,
        previousZoneId,
      )
      const savedZone = await this.zoneRepository.save(zone)
      previousZoneId = savedZone.getId()
    }

    return { count: parents.length, lastZoneId: previousZoneId }
  }

  private async processCrag(scrapedData: ScrapedCrag, zoneId: ZoneId) {
    const crag = await this.cragMapper.mapFromScrapedData(scrapedData, zoneId)
    return this.cragRepository.save(crag)
  }

  private async processCragTopos(
    scrapedData: ScrapedCrag,
    cragId: CragId,
  ): Promise<number> {
    const topos = scrapedData.cragTopos ?? scrapedData.topos ?? []
    let count = 0

    for (const topoData of topos) {
      const isOverview = !!scrapedData.cragTopos
      const topo = await this.topoMapper.mapFromScrapedData(
        topoData,
        cragId,
        undefined,
        isOverview,
      )
      await this.topoRepository.save(topo)
      count++
    }

    return count
  }

  private async processAreasRecursively(
    areas: ProcessedArea[],
    cragId: CragId,
    parentSectorId: SectorId | null,
    externalParentId: SectorExternalId | null,
  ): Promise<ProcessAreasResult> {
    let sectorsCount = 0
    let routesCount = 0
    let toposCount = 0
    const sectorIds: SectorId[] = []

    for (const area of areas) {
      const sector = await this.sectorMapper.mapFromScrapedData(
        area,
        cragId,
        parentSectorId,
        externalParentId,
      )
      const savedSector = await this.sectorRepository.save(sector)
      const sectorId = savedSector.getId()
      sectorsCount++
      sectorIds.push(sectorId)

      // Extract valid route external IDs for topo annotation validation
      const areaRoutes = area.routes ?? []
      const validRouteExternalIds = new Set<string | number>(
        areaRoutes.map((r) => r.id),
      )

      const sectorToposCount = await this.processSectorTopos(
        area.topos ?? [],
        cragId,
        sectorId,
        validRouteExternalIds,
      )
      toposCount += sectorToposCount

      const sectorRoutesCount = await this.processSectorRoutes(
        areaRoutes,
        cragId,
        sectorId,
      )
      routesCount += sectorRoutesCount

      if (area.subAreas && area.subAreas.length > 0) {
        const externalId = SectorExternalId.createFrom(String(area.id))
        const subResult = await this.processAreasRecursively(
          area.subAreas,
          cragId,
          sectorId,
          externalId,
        )
        sectorsCount += subResult.sectorsCount
        routesCount += subResult.routesCount
        toposCount += subResult.toposCount
        sectorIds.push(...subResult.sectorIds)
      }
    }

    return { sectorsCount, routesCount, toposCount, sectorIds }
  }

  private async processSectorTopos(
    topos: TopoImageData[],
    cragId: CragId,
    sectorId: SectorId,
    validRouteExternalIds: Set<string | number>,
  ): Promise<number> {
    let count = 0

    for (const topoData of topos) {
      const topo = await this.topoMapper.mapFromScrapedData(
        topoData,
        cragId,
        sectorId,
        false,
        validRouteExternalIds,
      )
      await this.topoRepository.save(topo)
      count++
    }

    return count
  }

  private async processSectorRoutes(
    routes: ScrapedRoute[],
    cragId: CragId,
    sectorId: SectorId,
  ): Promise<number> {
    let count = 0

    for (const routeData of routes) {
      const route = await this.routeMapper.mapFromScrapedData(
        routeData,
        cragId,
        sectorId,
      )
      await this.routeRepository.save(route)
      count++
    }

    return count
  }

  private async processFlatRoutes(
    routes: ScrapedRoute[],
    cragId: CragId,
  ): Promise<number> {
    let count = 0

    for (const routeData of routes) {
      const route = await this.routeMapper.mapFromScrapedData(
        routeData,
        cragId,
        null,
      )
      await this.routeRepository.save(route)
      count++
    }

    return count
  }
}
