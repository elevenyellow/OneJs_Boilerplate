import { AreaId } from '@area/domain/value-objects/area-id.vo'
import { AreaEntity, AreaPrismaRepository } from '@climb-zone/area'
import { CountryId, CragEntity, CragPrismaRepository } from '@climb-zone/crag'
import {
  RegionEntity,
  RegionId,
  RegionPrismaRepository,
} from '@climb-zone/region'
import { RoutePrismaRepository } from '@climb-zone/route'
import { SectorPrismaRepository } from '@climb-zone/sector'
import type { GeometryData } from '@climb-zone/shared'
import { ExternalId, Geometry, Name } from '@climb-zone/shared'
import { CountryPrismaRepository } from '@country'
import { CragId } from '@crag/domain/value-objects/crag-id.vo'
import { Inject, Injectable, logger } from '@OneJs/core'
import type { Job } from '@OneJs/jobs'
import { WorkerJob } from '@OneJs/jobs'
import { ScrapedDataMapperService } from '@scraper-thecrag/application/services/scraped-data-mapper.service'
import type { ScrapedNodeInfo } from '@scraper-thecrag/domain/dtos/scraped-node.dto'
import { TheCragApiScraper } from '@scraper-thecrag/infrastructure/scrapers/thecrag-api.scraper'
import { SectorId } from '@sector/domain/value-objects/sector-id.vo'

export const SCRAPE_QUEUE = 'scrape-country'

export interface ScrapeCountryJobData {
  countryId: string // UUID del país en nuestra DB
  countryExternalId: number // ID de TheCrag
  countryName: string // Para logs
}

interface ScrapeStats {
  crags: number
  areas: number
  sectors: number
  routes: number
  errors: number
}

/**
 * Background job that scrapes all crags, areas, sectors and routes
 * for a given country.
 *
 * INCREMENTAL: Saves each entity immediately after scraping it,
 * so progress is not lost if the job fails mid-way.
 *
 * All scraped data is validated through Value Objects before saving.
 */
@Injectable()
export class ScrapeCountryJob {
  private lastLogTime = 0
  private lastProgressTime = 0
  private startTime = 0
  private currentJob: Job<ScrapeCountryJobData> | null = null
  private readonly LOG_INTERVAL_MS = 10000
  // Update progress every 30 seconds to keep the job lock alive
  private readonly PROGRESS_INTERVAL_MS = 30000

  constructor(
    @Inject(TheCragApiScraper)
    private readonly scraper: TheCragApiScraper,
    @Inject(ScrapedDataMapperService)
    private readonly mapper: ScrapedDataMapperService,
    @Inject(CountryPrismaRepository)
    private readonly countryRepo: CountryPrismaRepository,
    @Inject(RegionPrismaRepository)
    private readonly regionRepo: RegionPrismaRepository,
    @Inject(CragPrismaRepository)
    private readonly cragRepo: CragPrismaRepository,
    @Inject(AreaPrismaRepository)
    private readonly areaRepo: AreaPrismaRepository,
    @Inject(SectorPrismaRepository)
    private readonly sectorRepo: SectorPrismaRepository,
    @Inject(RoutePrismaRepository)
    private readonly routeRepo: RoutePrismaRepository,
  ) {}

  @WorkerJob(SCRAPE_QUEUE, 1)
  async process(job: Job<ScrapeCountryJobData>): Promise<void> {
    const { countryId, countryExternalId, countryName } = job.data
    this.startTime = Date.now()
    this.lastProgressTime = Date.now()
    this.currentJob = job

    // Crear el CountryId Value Object
    const countryIdVO = CountryId.fromString(countryId)

    // Verificar que el país existe en la DB
    const countryExists = await this.countryRepo.findById(countryIdVO)
    if (!countryExists) {
      throw new Error(
        `Country ${countryName} (id: ${countryId}) not found in database. Cannot proceed with scraping.`,
      )
    }

    logger.info(
      'scraper:job',
      `🌍 Starting scrape for ${countryName} (externalId: ${countryExternalId}, countryId: ${countryId})`,
    )

    const stats: ScrapeStats = {
      crags: 0,
      areas: 0,
      sectors: 0,
      routes: 0,
      errors: 0,
    }

    try {
      logger.debug(
        'scraper:job',
        `🌐 Fetching top-level regions for ${countryName}...`,
      )
      const nodes = await this.scraper.getChildren(countryExternalId)

      if (nodes.length === 0) {
        logger.warn('scraper:job', `No regions found for ${countryName}`)
        return
      }

      logger.info(
        'scraper:job',
        `📍 ${countryName}: ${nodes.length} top-level regions`,
      )

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        const regionStart = Date.now()

        try {
          // Top-level nodes are the regions (e.g., "Comunidad Valenciana")
          // Pass null as regionName since these ARE the regions
          await this.scrapeAndSaveNode(
            node.id,
            node.name,
            node.type,
            countryIdVO,
            node.geometry ?? null,
            stats,
            null, // This node will become the region for its children
          )

          const regionTime = ((Date.now() - regionStart) / 1000).toFixed(1)
          logger.info(
            'scraper:job',
            `✓ [${i + 1}/${nodes.length}] ${node.name} (${regionTime}s) | Total: ${stats.crags}C ${stats.areas}A ${stats.sectors}S ${stats.routes}R`,
          )

          await job.updateProgress({
            region: i + 1,
            totalRegions: nodes.length,
            ...stats,
          })
        } catch (err) {
          stats.errors++
          logger.error(
            'scraper:job',
            `✗ [${i + 1}/${nodes.length}] ${node.name}: ${err instanceof Error ? err.message : err}`,
          )
        }
      }

      const totalTime = ((Date.now() - this.startTime) / 1000 / 60).toFixed(1)
      logger.info(
        'scraper:job',
        `✅ ${countryName} completed in ${totalTime}min | ${stats.crags} crags, ${stats.areas} areas, ${stats.sectors} sectors, ${stats.routes} routes${stats.errors > 0 ? `, ${stats.errors} errors` : ''}`,
      )
    } catch (err) {
      logger.error(
        'scraper:job',
        `❌ ${countryName} failed: ${err instanceof Error ? err.message : err}`,
      )
      throw err
    }
  }

  private async logProgress(
    stats: ScrapeStats,
    currentCrag?: string,
  ): Promise<void> {
    const now = Date.now()

    // Update job progress periodically to keep the lock alive and prevent stalling
    if (
      this.currentJob &&
      now - this.lastProgressTime >= this.PROGRESS_INTERVAL_MS
    ) {
      this.lastProgressTime = now
      await this.currentJob.updateProgress({
        ...stats,
        elapsed: Math.floor((now - this.startTime) / 1000),
        currentCrag,
      })
    }

    if (now - this.lastLogTime >= this.LOG_INTERVAL_MS) {
      this.lastLogTime = now
      const elapsed = ((now - this.startTime) / 1000 / 60).toFixed(1)
      const cragInfo = currentCrag ? ` | Current: ${currentCrag}` : ''
      logger.info(
        'scraper:job',
        `⏱️ Progress [${elapsed}min]${cragInfo}: ${stats.crags}C ${stats.areas}A ${stats.sectors}S ${stats.routes}R ${stats.errors}E`,
      )
    }
  }

  private async scrapeAndSaveNode(
    nodeId: number,
    nodeName: string,
    nodeType: string,
    countryId: CountryId,
    geometryFromParent: GeometryData | null,
    stats: ScrapeStats,
    regionId: RegionId | null = null,
  ): Promise<{ cragId?: CragId; areaId?: AreaId; regionId?: RegionId }> {
    logger.debug(
      'scraper:job',
      `🔍 Processing node: ${nodeName} (type: ${nodeType}, id: ${nodeId}, regionId: ${regionId?.toString() ?? 'none'})`,
    )

    const info = await this.scraper.getNodeInfo(nodeId)
    const geometry = info?.geometry ?? geometryFromParent

    const isCragLevel = nodeType === 'Crag'
    const hasRoutes = await this.checkHasRoutes(nodeId)

    if (isCragLevel || hasRoutes) {
      logger.debug(
        'scraper:job',
        `📌 Node ${nodeName} identified as Crag (isCragLevel: ${isCragLevel}, hasRoutes: ${hasRoutes})`,
      )
      // This is a Crag - save and process children
      const crag = await this.saveCrag(
        nodeId,
        nodeName,
        countryId,
        geometry,
        info,
        regionId,
      )
      stats.crags++
      await this.logProgress(stats, nodeName)

      if (hasRoutes) {
        // Crag has direct routes - create default area/sector
        const area = await this.saveArea(
          nodeId,
          nodeName,
          crag.id,
          null,
          geometry,
          info,
          nodeType,
        )
        stats.areas++

        const sector = await this.saveSector(
          nodeId,
          nodeName,
          area.id,
          geometry,
          info,
          nodeType,
        )
        stats.sectors++

        await this.saveRoutesForSector(nodeId, sector.id, stats)

        const children = await this.scraper.getChildren(nodeId)
        for (const child of children) {
          await this.scrapeAndSaveCragChild(
            child.id,
            child.name,
            child.type,
            crag.id,
            area.id,
            child.geometry ?? null,
            stats,
          )
        }

        return { cragId: crag.id, areaId: area.id }
      }

      const children = await this.scraper.getChildren(nodeId)
      for (const child of children) {
        await this.scrapeAndSaveCragChild(
          child.id,
          child.name,
          child.type,
          crag.id,
          null,
          child.geometry ?? null,
          stats,
        )
      }

      return { cragId: crag.id }
    }

    // This is a region - save it and recurse into children
    const children = await this.scraper.getChildren(nodeId)
    logger.debug(
      'scraper:job',
      `📁 Node ${nodeName} is a region with ${children.length} children`,
    )

    // If we don't have a region yet, this node IS the region - save it
    let currentRegionId = regionId
    if (!currentRegionId) {
      const region = await this.saveRegion(
        nodeId,
        nodeName,
        countryId,
        geometry,
      )
      currentRegionId = region.id
      logger.debug(
        'scraper:job',
        `  💾 Saved region: ${nodeName} (id: ${currentRegionId.toString()})`,
      )
    }

    for (const child of children) {
      await this.scrapeAndSaveNode(
        child.id,
        child.name,
        child.type,
        countryId,
        child.geometry ?? null,
        stats,
        currentRegionId,
      )
    }

    return { regionId: currentRegionId }
  }

  private async scrapeAndSaveCragChild(
    nodeId: number,
    nodeName: string,
    nodeType: string,
    cragId: CragId,
    parentAreaId: AreaId | null,
    geometryFromParent: GeometryData | null,
    stats: ScrapeStats,
  ): Promise<void> {
    logger.debug(
      'scraper:job',
      `  └─ Processing crag child: ${nodeName} (type: ${nodeType}, id: ${nodeId})`,
    )

    const info = await this.scraper.getNodeInfo(nodeId)
    const geometry = info?.geometry ?? geometryFromParent

    const routes = await this.scraper.getRoutes(nodeId)
    const hasRoutes = routes.length > 0

    if (hasRoutes) {
      logger.debug(
        'scraper:job',
        `  └─ ${nodeName}: found ${routes.length} routes`,
      )
      let areaId = parentAreaId

      if (!areaId) {
        const area = await this.saveArea(
          nodeId,
          nodeName,
          cragId,
          null,
          geometry,
          info,
          nodeType,
        )
        areaId = area.id
        stats.areas++
      }

      const sector = await this.saveSector(
        nodeId,
        nodeName,
        areaId,
        geometry,
        info,
        nodeType,
      )
      stats.sectors++

      await this.saveRoutes(routes, sector.id, stats)
      await this.logProgress(stats)

      const children = await this.scraper.getChildren(nodeId)
      for (const child of children) {
        await this.scrapeAndSaveCragChild(
          child.id,
          child.name,
          child.type,
          cragId,
          areaId,
          child.geometry ?? null,
          stats,
        )
      }
    } else {
      const children = await this.scraper.getChildren(nodeId)

      if (children.length > 0) {
        logger.debug(
          'scraper:job',
          `  └─ ${nodeName}: no routes, ${children.length} children to process`,
        )

        const area = await this.saveArea(
          nodeId,
          nodeName,
          cragId,
          parentAreaId,
          geometry,
          info,
          nodeType,
        )
        stats.areas++

        for (const child of children) {
          await this.scrapeAndSaveCragChild(
            child.id,
            child.name,
            child.type,
            cragId,
            area.id,
            child.geometry ?? null,
            stats,
          )
        }
      }
    }
  }

  private async checkHasRoutes(nodeId: number): Promise<boolean> {
    const routes = await this.scraper.getRoutes(nodeId)
    return routes.length > 0
  }

  private async saveRegion(
    externalId: number,
    name: string,
    countryId: CountryId,
    geometry: GeometryData | null | undefined,
  ): Promise<RegionEntity> {
    const regionEntity = new RegionEntity(
      RegionId.generate(),
      ExternalId.create(externalId),
      countryId,
      Name.create(name),
      geometry ? Geometry.fromJSON(geometry) : null,
    )
    const saved = await this.regionRepo.saveByExternalId(regionEntity)
    return saved
  }

  private async saveCrag(
    externalId: number,
    name: string,
    countryId: CountryId,
    geometry: GeometryData | null | undefined,
    info: ScrapedNodeInfo | null,
    regionId: RegionId | null = null,
  ): Promise<CragEntity> {
    const validatedData = this.mapper.mapToCrag(
      externalId,
      name,
      countryId,
      geometry,
      info,
      regionId,
    )
    const entity = this.mapper.createCragEntity(validatedData)
    logger.debug(
      'scraper:job',
      `  💾 Saving crag: ${name} (externalId: ${externalId}, countryId: ${countryId.toString()}, regionId: ${regionId?.toString() ?? 'none'})`,
    )
    const saved = await this.cragRepo.saveByExternalId(entity)
    return saved
  }

  private async saveArea(
    externalId: number,
    name: string,
    cragId: CragId,
    parentAreaId: AreaId | null,
    geometry: GeometryData | null | undefined,
    info: ScrapedNodeInfo | null,
    rawType?: string,
  ): Promise<AreaEntity> {
    const validatedData = this.mapper.mapToArea(
      externalId,
      name,
      cragId,
      parentAreaId,
      geometry,
      info,
      rawType,
    )
    const entity = this.mapper.createAreaEntity(validatedData)
    const saved = await this.areaRepo.saveByExternalId(entity)
    logger.debug(
      'scraper:job',
      `  💾 Saved area: ${name} (externalId: ${externalId})`,
    )
    return saved
  }

  private async saveSector(
    externalId: number,
    name: string,
    areaId: AreaId,
    geometry: GeometryData | null | undefined,
    info: ScrapedNodeInfo | null,
    rawType?: string,
  ) {
    const validatedData = this.mapper.mapToSector(
      externalId,
      name,
      areaId,
      geometry,
      info,
      rawType,
    )
    const entity = this.mapper.createSectorEntity(validatedData)
    const saved = await this.sectorRepo.saveByExternalId(entity)
    logger.debug(
      'scraper:job',
      `  💾 Saved sector: ${name} (externalId: ${externalId})`,
    )
    return saved
  }

  private async saveRoutesForSector(
    nodeId: number,
    sectorId: SectorId,
    stats: ScrapeStats,
  ): Promise<void> {
    const routes = await this.scraper.getRoutes(nodeId)
    await this.saveRoutes(routes, sectorId, stats)
  }

  private async saveRoutes(
    routes: Awaited<ReturnType<TheCragApiScraper['getRoutes']>>,
    sectorId: SectorId,
    stats: ScrapeStats,
  ): Promise<void> {
    if (routes.length > 0) {
      logger.debug(
        'scraper:job',
        `  🧗 Saving ${routes.length} routes for sector...`,
      )
    }

    for (const rawRoute of routes) {
      try {
        const validatedData = this.mapper.mapToRoute(rawRoute, sectorId)
        const entity = this.mapper.createRouteEntity(validatedData)
        await this.routeRepo.saveByExternalId(entity)
        stats.routes++
      } catch (err) {
        stats.errors++
        logger.warn(
          'scraper:job',
          `  ⚠️ Failed to save route ${rawRoute.name || rawRoute.id}: ${err instanceof Error ? err.message : err}`,
        )
      }
    }
  }
}
