import { Inject, Injectable } from '@OneJs/core'
import { Geometry, BetaInfo, Grade, ExternalId } from '@climb-zone/shared'
import { CragPrismaRepository, CragEntity } from '@climb-zone/crag'
import { AreaPrismaRepository, AreaEntity } from '@climb-zone/area'
import { SectorPrismaRepository, SectorEntity, SectorStatsService, SectorStats } from '@climb-zone/sector'
import { RoutePrismaRepository, RouteEntity } from '@climb-zone/route'
import { TopoPrismaRepository, TopoImageEntity, TopoImageId } from '@climb-zone/topo'
import { CragId } from '@crag/domain/value-objects/crag-id.vo'
import { AreaId } from '@area/domain/value-objects/area-id.vo'
import { SectorId } from '@sector/domain/value-objects/sector-id.vo'
import { RouteId } from '@route/domain/value-objects/route-id.vo'
import type {
  ScrapedCragNode,
  ScrapedRouteData,
} from '@scraper-thecrag/domain/dtos/scraped-node.dto'
import type { TopoImageData } from '@scraper-thecrag/domain/dtos/topo-image.dto'
import { TopoNumber } from '@route/domain/value-objects/topo-number.vo'

export interface ImportResult {
  cragId: CragId
  cragsCreated: number
  areasCreated: number
  sectorsCreated: number
  routesCreated: number
  toposCreated: number
  topoPositionsCreated: number
  duration: number
  errors: ImportError[]
}

export interface ImportError {
  nodeId: number
  nodeName: string
  type: string
  message: string
}

export interface ImportOptions {
  country: string
  region?: string
}

/**
 * Service for importing scraped TheCrag data into the database
 * Orchestrates the creation of Crag, Area, Sector, and Route entities
 */
@Injectable()
export class CragImporterService {
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
    @Inject(SectorStatsService)
    private readonly statsService: SectorStatsService,
  ) {}

  /**
   * Import a complete scraped crag hierarchy into the database
   */
  async importCrag(data: ScrapedCragNode, options: ImportOptions): Promise<ImportResult> {
    const startTime = Date.now()
    const result: ImportResult = {
      cragId: CragId.generate(),
      cragsCreated: 0,
      areasCreated: 0,
      sectorsCreated: 0,
      routesCreated: 0,
      toposCreated: 0,
      topoPositionsCreated: 0,
      duration: 0,
      errors: [],
    }

    console.log(`🔄 Starting import for ${data.name}...`)

    try {
      // 1. Create the root Crag entity
      const cragEntity = this.createCragEntity(data, options)
      const savedCrag = await this.cragRepo.saveByExternalId(cragEntity)

      result.cragId = savedCrag.id
      result.cragsCreated = 1

      console.log(`✅ Created crag: ${savedCrag.name} (${savedCrag.id.toString()})`)

      // 2. Process children recursively
      await this.processChildren(data.children, savedCrag.id, null, result)

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      result.errors.push({
        nodeId: data.id,
        nodeName: data.name,
        type: data.type,
        message,
      })
    }

    result.duration = Date.now() - startTime

    console.log(`\n✅ Import completed in ${(result.duration / 1000).toFixed(2)}s`)
    console.log(`   - Crags: ${result.cragsCreated}`)
    console.log(`   - Areas: ${result.areasCreated}`)
    console.log(`   - Sectors: ${result.sectorsCreated}`)
    console.log(`   - Routes: ${result.routesCreated}`)
    console.log(`   - Topos: ${result.toposCreated}`)
    console.log(`   - Topo positions: ${result.topoPositionsCreated}`)
    if (result.errors.length > 0) {
      console.log(`   - Errors: ${result.errors.length}`)
    }

    return result
  }

  /**
   * Create a Crag entity from scraped data
   */
  private createCragEntity(data: ScrapedCragNode, options: ImportOptions): CragEntity {
    const geometry = data.info?.geometry ? Geometry.fromJSON(data.info.geometry) : null
    const beta = BetaInfo.fromJSON(data.info?.beta)
    const sourceUrl = `https://www.thecrag.com/climbing/${data.info?.urlStub ?? data.id}`

    return new CragEntity(
      CragId.generate(),
      ExternalId.create(data.id),
      data.name,
      options.country,
      options.region ?? null,
      geometry,
      data.info?.seasonality ?? [],
      beta.getDescription(),
      beta.getApproach(),
      beta.getEthic(),
      sourceUrl,
    )
  }

  /**
   * Process child nodes recursively
   */
  private async processChildren(
    children: ScrapedCragNode[],
    cragId: CragId,
    parentAreaId: AreaId | null,
    result: ImportResult,
  ): Promise<void> {
    for (const child of children) {
      try {
        await this.processNode(child, cragId, parentAreaId, result)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        result.errors.push({
          nodeId: child.id,
          nodeName: child.name,
          type: child.type,
          message,
        })
      }
    }
  }

  /**
   * Process a single node based on its type
   */
  private async processNode(
    node: ScrapedCragNode,
    cragId: CragId,
    parentAreaId: AreaId | null,
    result: ImportResult,
  ): Promise<void> {
    const hasRoutes = node.routes && node.routes.length > 0
    const hasOnlyChildren = node.children.length > 0 && !hasRoutes

    if (hasOnlyChildren && !hasRoutes) {
      // This is an Area (container for other areas/sectors)
      const areaEntity = this.createAreaEntity(node, cragId, parentAreaId)
      const savedArea = await this.areaRepo.saveByExternalId(areaEntity)
      result.areasCreated++

      // Process children with this area as parent
      await this.processChildren(node.children, cragId, savedArea.id, result)
    } else if (hasRoutes) {
      // This is a Sector (has routes)
      let areaId = parentAreaId

      // If no parent area, create a default one
      if (!areaId) {
        const defaultArea = this.createDefaultAreaEntity(node, cragId)
        const savedDefaultArea = await this.areaRepo.saveByExternalId(defaultArea)
        areaId = savedDefaultArea.id
        result.areasCreated++
      }

      // Create the sector entity
      const sectorEntity = this.createSectorEntity(node, areaId)
      const savedSector = await this.sectorRepo.saveByExternalId(sectorEntity)
      result.sectorsCreated++

      // Build topo number map from topo data (routeId -> topoNumber)
      const topoNumberMap = this.buildTopoNumberMap(node.topos)

      // Create route entities with topo numbers
      const routeEntities = this.createRouteEntities(node.routes!, savedSector.id, topoNumberMap)
      const routesCreated = await this.routeRepo.saveMany(routeEntities)
      result.routesCreated += routesCreated

      // Calculate and update stats
      const stats = this.calculateSectorStats(node.routes!)
      savedSector.updateStats(stats)
      await this.sectorRepo.updateStats(savedSector)

      // Save topo images with route positions
      if (node.topos && node.topos.length > 0) {
        await this.saveToposWithPositions(node.topos, savedSector.id, node.routes!, result)
      }

      // Process any nested children
      if (node.children.length > 0) {
        await this.processChildren(node.children, cragId, areaId, result)
      }
    } else {
      // Empty node - create as area anyway
      const areaEntity = this.createAreaEntity(node, cragId, parentAreaId)
      await this.areaRepo.saveByExternalId(areaEntity)
      result.areasCreated++
    }
  }

  /**
   * Create an Area entity from scraped data
   */
  private createAreaEntity(
    node: ScrapedCragNode,
    cragId: CragId,
    parentAreaId: AreaId | null,
  ): AreaEntity {
    const geometry = node.info?.geometry ? Geometry.fromJSON(node.info.geometry) : null
    const beta = BetaInfo.fromJSON(node.info?.beta)
    const areaType = node.type === 'Cliff' ? 'Cliff' : 'Area'

    return new AreaEntity(
      AreaId.generate(),
      ExternalId.create(node.id),
      cragId,
      parentAreaId,
      node.name,
      areaType,
      geometry,
      beta,
    )
  }

  /**
   * Create a default Area entity for sectors without a parent
   */
  private createDefaultAreaEntity(node: ScrapedCragNode, cragId: CragId): AreaEntity {
    const geometry = node.info?.geometry ? Geometry.fromJSON(node.info.geometry) : null

    return new AreaEntity(
      AreaId.generate(),
      ExternalId.create(node.id * -1), // Negative to avoid conflicts
      cragId,
      null,
      'Default Area',
      'Area',
      geometry,
      BetaInfo.empty(),
    )
  }

  /**
   * Create a Sector entity from scraped data
   */
  private createSectorEntity(node: ScrapedCragNode, areaId: AreaId): SectorEntity {
    const geometry = node.info?.geometry ? Geometry.fromJSON(node.info.geometry) : null
    const beta = BetaInfo.fromJSON(node.info?.beta)
    const sectorType = node.type === 'Cliff' ? 'Cliff' : 'Sector'

    return new SectorEntity(
      SectorId.generate(),
      ExternalId.create(node.id),
      areaId,
      node.name,
      sectorType,
      geometry,
      node.info?.seasonality ?? [],
      beta,
      SectorStats.empty(),
      node.info?.priceCategory ?? null,
      Boolean(node.info?.hasTopo),
      node.info?.kudos ?? null,
    )
  }

  /**
   * Build a map of route external IDs to topo numbers from topo data
   */
  private buildTopoNumberMap(topos: TopoImageData[] | undefined): Map<number, string> {
    const map = new Map<number, string>()
    
    if (!topos) return map

    for (const topo of topos) {
      for (const route of topo.routes) {
        if (route.id && route.num) {
          // Only set if not already set (first occurrence wins)
          if (!map.has(route.id)) {
            map.set(route.id, route.num)
          }
        }
      }
    }

    return map
  }

  /**
   * Create Route entities from scraped data
   * @param routes - Array of scraped route data
   * @param sectorId - The sector ID for these routes
   * @param topoNumberMap - Map of route external IDs to topo numbers
   */
  private createRouteEntities(
    routes: ScrapedRouteData[],
    sectorId: SectorId,
    topoNumberMap: Map<number, string> = new Map(),
  ): RouteEntity[] {
    return routes.map((r) => {
      const grade = r.grade ? new Grade(r.grade, 'french', r.gradeIndex ?? undefined) : null
      const topoNum = topoNumberMap.get(r.id)

      return new RouteEntity(
        RouteId.generate(),
        ExternalId.create(r.id),
        sectorId,
        r.name,
        grade,
        r.height,
        r.pitches,
        r.bolts,
        r.stars,
        r.quality,
        r.ascents,
        r.subType as 'sport' | 'trad' | 'boulder' | 'mixed' | null,
        r.firstAscent,
        r.tags,
        r.warnings,
        TopoNumber.create(topoNum),
      )
    })
  }

  /**
   * Calculate sector statistics from routes
   */
  private calculateSectorStats(routes: ScrapedRouteData[]): SectorStats {
    const routeData = routes.map((r) => ({
      grade: r.grade,
      height: r.height,
      ascents: r.ascents,
    }))

    return this.statsService.calculateStats(routeData)
  }

  /**
   * Save topo images and link routes to their positions
   */
  private async saveToposWithPositions(
    topos: TopoImageData[],
    sectorId: SectorId,
    routes: ScrapedRouteData[],
    result: ImportResult,
  ): Promise<void> {
    // Build a map of external route IDs to internal route IDs
    // We need to look up routes that were just saved
    const routeExternalToInternal = new Map<number, RouteId>()
    for (const route of routes) {
      const savedRoute = await this.routeRepo.findByExternalId(ExternalId.create(route.id))
      if (savedRoute) {
        routeExternalToInternal.set(route.id, savedRoute.id)
      }
    }

    for (const topoData of topos) {
      try {
        // Create TopoImage entity
        const topoEntity = new TopoImageEntity(
          TopoImageId.generate(),
          topoData.topoId,
          sectorId,
          topoData.thumbnailUrl,
          topoData.fullImageUrl,
          topoData.width,
          topoData.height,
          topoData.originalWidth,
          topoData.originalHeight,
          topoData.viewScale,
          null, // sourceUrl - could be constructed from sector URL
        )

        // Build position data for each route on this topo
        const positions: Array<{
          routeId: RouteId
          topoNumber: string
          points: string
          zindex?: number
          order?: number
          gradeClass?: string | null
        }> = []

        for (const routeAnnotation of topoData.routes) {
          const internalRouteId = routeExternalToInternal.get(routeAnnotation.id)
          if (internalRouteId) {
            positions.push({
              routeId: internalRouteId,
              topoNumber: routeAnnotation.num,
              points: routeAnnotation.points,
              zindex: parseInt(routeAnnotation.zindex) || 0,
              order: routeAnnotation.order,
              gradeClass: routeAnnotation.gradeClass,
            })
          }
        }

        // Save topo with positions
        const { positionsCreated } = await this.topoRepo.saveTopoImageWithPositions(
          topoEntity,
          positions,
        )

        result.toposCreated++
        result.topoPositionsCreated += positionsCreated
      } catch (error) {
        console.warn(`Failed to save topo ${topoData.topoId}:`, error)
      }
    }
  }
}
