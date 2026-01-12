import { Inject, Injectable } from '@OneJs/core'
import { AreaId } from '@area/domain/value-objects/area-id.vo'
import { AreaPrismaRepository } from '@climb-zone/area'
import { CountryId, CragPrismaRepository } from '@climb-zone/crag'
import { RegionId } from '@climb-zone/region'
import { RoutePrismaRepository } from '@climb-zone/route'
import { SectorPrismaRepository, SectorStatsService } from '@climb-zone/sector'
import {
  CragTopoImageEntity,
  TopoImageEntity,
  TopoImageId,
  TopoPrismaRepository,
  type CragTopoSectorPositionData,
} from '@climb-zone/topo'
import { CragId } from '@crag/domain/value-objects/crag-id.vo'
import { RouteId } from '@route/domain/value-objects/route-id.vo'
import type {
  ScrapedCragNode,
  ScrapedRouteData,
} from '@scraper-thecrag/domain/dtos/scraped-node.dto'
import type { TopoImageData } from '@scraper-thecrag/domain/dtos/topo-image.dto'
import { ScrapedDataMapperService } from './scraped-data-mapper.service'

export interface ImportResult {
  cragId: CragId
  cragsCreated: number
  areasCreated: number
  sectorsCreated: number
  routesCreated: number
  toposCreated: number
  topoPositionsCreated: number
  cragToposCreated: number
  cragTopoPositionsCreated: number
  headerImages: number
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
  /** Country ID (required) */
  countryId: CountryId
  /** Region ID (optional) */
  regionId?: RegionId | null
}

/**
 * Service for importing scraped TheCrag data into the database
 * Orchestrates the creation of Crag, Area, Sector, and Route entities
 * Uses ScrapedDataMapperService for entity creation with proper value objects
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
    @Inject(ScrapedDataMapperService)
    private readonly mapper: ScrapedDataMapperService,
  ) {}

  /**
   * Import a complete scraped crag hierarchy into the database
   */
  async importCrag(
    data: ScrapedCragNode,
    options: ImportOptions,
  ): Promise<ImportResult> {
    const startTime = Date.now()
    const result: ImportResult = {
      cragId: CragId.generate(),
      cragsCreated: 0,
      areasCreated: 0,
      sectorsCreated: 0,
      routesCreated: 0,
      toposCreated: 0,
      topoPositionsCreated: 0,
      cragToposCreated: 0,
      cragTopoPositionsCreated: 0,
      headerImages: 0,
      duration: 0,
      errors: [],
    }

    console.log(`🔄 Starting import for ${data.name}...`)

    try {
      // 1. Create the root Crag entity using mapper
      console.log(`   💾 Guardando Crag: ${data.name}`)

      const cragData = this.mapper.mapToCrag(
        data.id,
        data.name,
        options.countryId,
        data.info?.geometry,
        data.info ?? null,
        options.regionId ?? null,
      )
      const savedCrag = await this.cragRepo.saveByExternalId(
        this.mapper.createCragEntity(cragData),
        data.info?.apiResponseRaw,
      )

      result.cragId = savedCrag.id
      result.cragsCreated = 1

      console.log(`      ✅ Crag guardado: ${savedCrag.id.toString()}`)
      console.log(
        `      - Header Image: ${data.info?.headerImageUrl ? '✅' : '❌'}`,
      )
      console.log(
        `      - Overview Topo: ${data.cragTopos?.length ?? 0} (panorámica de sectores)`,
      )
      console.log('')

      // 2. Save crag overview topos if available
      if (data.cragTopos && data.cragTopos.length > 0) {
        console.log(`   🗺️  Guardando topos panorámicos del crag...`)
        await this.saveCragToposWithPositions(
          data.cragTopos,
          savedCrag.id,
          result,
        )
        console.log('')
      }

      // 2.5. Handle routes directly on the crag (no children/sectors)
      // Some crags like Cheste have routes directly without sub-sectors
      if (
        data.routes &&
        data.routes.length > 0 &&
        data.children.length === 0
      ) {
        console.log(
          `   📍 Crag tiene ${data.routes.length} rutas directas (sin sectores)`,
        )
        await this.saveRoutesDirectlyOnCrag(data, savedCrag.id, result)
        console.log('')
      }

      // 3. Process children recursively
      for (const child of data.children) {
        try {
          await this.processScrapedNode(
            child,
            savedCrag.id,
            null, // No parent area for direct children of crag
            result,
          )
        } catch (error: unknown) {
          const err = error as Error
          result.errors.push({
            nodeId: child.id,
            nodeName: child.name,
            type: child.type,
            message: err.message,
          })
          console.error(`   ❌ Error en ${child.name}: ${err.message}`)
        }
      }
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

    console.log(
      `\n✅ Import completed in ${(result.duration / 1000).toFixed(2)}s`,
    )
    console.log(`   - Crags: ${result.cragsCreated}`)
    console.log(`   - Areas: ${result.areasCreated}`)
    console.log(`   - Sectors: ${result.sectorsCreated}`)
    console.log(`   - Routes: ${result.routesCreated}`)
    console.log(`   - Topos: ${result.toposCreated}`)
    console.log(`   - Topo positions: ${result.topoPositionsCreated}`)
    console.log(`   - Crag topos: ${result.cragToposCreated}`)
    console.log(`   - Crag topo positions: ${result.cragTopoPositionsCreated}`)
    console.log(`   - Header images: ${result.headerImages}`)
    if (result.errors.length > 0) {
      console.log(`   - Errors: ${result.errors.length}`)
    }

    return result
  }

  /**
   * Process a scraped node (Area, Sector, or Cliff)
   * Recursively processes children
   */
  private async processScrapedNode(
    node: ScrapedCragNode,
    cragId: CragId,
    parentAreaId: AreaId | null,
    result: ImportResult,
  ): Promise<void> {
    console.log(`   🔍 Procesando: ${node.name} (${node.type})`)

    const hasRoutes = node.routes && node.routes.length > 0
    const hasTopos = node.topos && node.topos.length > 0

    console.log(`      📊 Info del scraper:`)
    console.log(`         - Routes: ${node.routes?.length ?? 0}`)
    console.log(`         - Topos: ${node.topos?.length ?? 0}`)
    console.log(
      `         - Header Image: ${node.info?.headerImageUrl ? '✅' : '❌'}`,
    )

    // If this node has routes, treat it as a sector (needs an area parent)
    if (hasRoutes) {
      // Create area first
      const areaData = this.mapper.mapToArea(
        node.id,
        node.name,
        cragId,
        parentAreaId,
        node.info?.geometry,
        node.info ?? null,
        node.type,
      )
      const area = await this.areaRepo.saveByExternalId(
        this.mapper.createAreaEntity(areaData),
        node.info?.apiResponseRaw,
      )
      result.areasCreated++

      // Create sector
      const sectorData = this.mapper.mapToSector(
        node.id,
        node.name,
        area.id,
        node.info?.geometry,
        node.info ?? null,
        node.type,
      )
      const sector = await this.sectorRepo.saveByExternalId(
        this.mapper.createSectorEntity(sectorData),
        node.info?.apiResponseRaw,
      )
      result.sectorsCreated++

      // Track header image
      if (node.info?.headerImageUrl) {
        result.headerImages++
      }

      // Build topo number map from topo data
      const topoNumberMap = new Map<number, string>()
      if (hasTopos) {
        for (const topo of node.topos!) {
          for (const topoRoute of topo.routes) {
            if (
              topoRoute.id &&
              topoRoute.num &&
              !topoNumberMap.has(topoRoute.id)
            ) {
              topoNumberMap.set(topoRoute.id, topoRoute.num)
            }
          }
        }
      }

      // Save routes
      const savedRouteIds = new Map<number, RouteId>()
      for (const route of node.routes!) {
        const topoNum = topoNumberMap.get(route.id)
        const routeData = this.mapper.mapToRoute(route, sector.id, topoNum)
        const savedRoute = await this.routeRepo.saveByExternalId(
          this.mapper.createRouteEntity(routeData),
        )
        savedRouteIds.set(route.id, savedRoute.id)
        result.routesCreated++
      }

      // Calculate and update sector stats (avgGrade, avgHeight, maxHeight, etc.)
      const sectorStats = this.calculateSectorStats(node.routes!)
      sector.updateStats(sectorStats)
      await this.sectorRepo.updateStats(sector)
      console.log(
        `      📊 Stats calculados: ${sectorStats.routeCount} rutas, avg: ${sectorStats.avgGrade}, maxH: ${sectorStats.maxHeight}m`,
      )

      // Save topos with positions (SVG data)
      if (hasTopos) {
        for (const topoData of node.topos!) {
          try {
            const topoEntity = new TopoImageEntity(
              TopoImageId.generate(),
              topoData.topoId,
              sector.id,
              topoData.thumbnailUrl,
              topoData.fullImageUrl,
              topoData.width,
              topoData.height,
              topoData.originalWidth,
              topoData.originalHeight,
              topoData.viewScale,
              null,
            )

            // Build positions for routes (contains SVG points data)
            const positions: Array<{
              routeId: RouteId
              topoNumber: string
              points: string
              zindex?: number
              order?: number
              gradeClass?: string | null
            }> = []

            for (const topoRoute of topoData.routes) {
              const internalRouteId = savedRouteIds.get(topoRoute.id)
              if (internalRouteId) {
                positions.push({
                  routeId: internalRouteId,
                  topoNumber: topoRoute.num,
                  points: topoRoute.points, // SVG path data
                  zindex: parseInt(topoRoute.zindex) || 0,
                  order: topoRoute.order,
                  gradeClass: topoRoute.gradeClass,
                })
              }
            }

            if (positions.length > 0) {
              const { positionsCreated } =
                await this.topoRepo.saveTopoImageWithPositions(
                  topoEntity,
                  positions,
                )
              result.toposCreated++
              result.topoPositionsCreated += positionsCreated
              console.log(
                `      ✅ Topo ${topoData.topoId}: ${positions.length} rutas con SVG`,
              )
            }
          } catch (error: unknown) {
            const err = error as Error
            console.warn(
              `      ⚠️  Error guardando topo ${topoData.topoId}: ${err.message}`,
            )
          }
        }
      }

      console.log(`      ✅ Sector guardado: ${node.name}`)
      console.log('')
    }

    // Process children recursively
    for (const child of node.children) {
      await this.processScrapedNode(
        child,
        cragId,
        null, // For simplicity, not tracking nested areas
        result,
      )
    }
  }

  /**
   * Calculate sector statistics from scraped routes
   */
  private calculateSectorStats(routes: ScrapedRouteData[]) {
    const routeData = routes.map((r) => ({
      grade: r.grade,
      height: r.height,
      ascents: r.ascents,
    }))
    return this.statsService.calculateStats(routeData)
  }

  /**
   * Save routes that are directly on the crag (no children/sectors)
   * Creates a virtual sector to contain these routes
   */
  private async saveRoutesDirectlyOnCrag(
    data: ScrapedCragNode,
    cragId: CragId,
    result: ImportResult,
  ): Promise<void> {
    // Create a virtual area for the crag's direct routes
    const areaData = this.mapper.mapToArea(
      data.id,
      data.name, // Use crag name for the area
      cragId,
      null, // No parent area
      data.info?.geometry,
      data.info ?? null,
      'Crag',
    )
    const area = await this.areaRepo.saveByExternalId(
      this.mapper.createAreaEntity(areaData),
      data.info?.apiResponseRaw,
    )
    result.areasCreated++

    // Create a virtual sector to contain the routes
    const sectorData = this.mapper.mapToSector(
      data.id,
      data.name, // Use crag name for the sector
      area.id,
      data.info?.geometry,
      data.info ?? null,
      'Sector',
    )
    const sector = await this.sectorRepo.saveByExternalId(
      this.mapper.createSectorEntity(sectorData),
      data.info?.apiResponseRaw,
    )
    result.sectorsCreated++

    // Track header image
    if (data.info?.headerImageUrl) {
      result.headerImages++
    }

    // Build topo number map from topo data (if any)
    const topoNumberMap = new Map<number, string>()
    if (data.topos && data.topos.length > 0) {
      for (const topo of data.topos) {
        for (const topoRoute of topo.routes) {
          if (topoRoute.id && topoRoute.num && !topoNumberMap.has(topoRoute.id)) {
            topoNumberMap.set(topoRoute.id, topoRoute.num)
          }
        }
      }
    }

    // Save routes
    const savedRouteIds = new Map<number, RouteId>()
    for (const route of data.routes!) {
      const topoNum = topoNumberMap.get(route.id)
      const routeData = this.mapper.mapToRoute(route, sector.id, topoNum)
      const savedRoute = await this.routeRepo.saveByExternalId(
        this.mapper.createRouteEntity(routeData),
      )
      savedRouteIds.set(route.id, savedRoute.id)
      result.routesCreated++
    }

    // Calculate and update sector stats
    const sectorStats = this.calculateSectorStats(data.routes!)
    sector.updateStats(sectorStats)
    await this.sectorRepo.updateStats(sector)
    console.log(
      `      📊 Stats calculados: ${sectorStats.routeCount} rutas, avg: ${sectorStats.avgGrade}, maxH: ${sectorStats.maxHeight}m`,
    )

    // Save topos with positions (if any)
    if (data.topos && data.topos.length > 0) {
      for (const topoData of data.topos) {
        try {
          const topoEntity = new TopoImageEntity(
            TopoImageId.generate(),
            topoData.topoId,
            sector.id,
            topoData.thumbnailUrl,
            topoData.fullImageUrl,
            topoData.width,
            topoData.height,
            topoData.originalWidth,
            topoData.originalHeight,
            topoData.viewScale,
            null,
          )

          const positions: Array<{
            routeId: RouteId
            topoNumber: string
            points: string
            zindex?: number
            order?: number
            gradeClass?: string | null
          }> = []

          for (const topoRoute of topoData.routes) {
            const internalRouteId = savedRouteIds.get(topoRoute.id)
            if (internalRouteId) {
              positions.push({
                routeId: internalRouteId,
                topoNumber: topoRoute.num,
                points: topoRoute.points,
                zindex: parseInt(topoRoute.zindex) || 0,
                order: topoRoute.order,
                gradeClass: topoRoute.gradeClass,
              })
            }
          }

          if (positions.length > 0) {
            const { positionsCreated } =
              await this.topoRepo.saveTopoImageWithPositions(topoEntity, positions)
            result.toposCreated++
            result.topoPositionsCreated += positionsCreated
            console.log(
              `      ✅ Topo ${topoData.topoId}: ${positions.length} rutas con SVG`,
            )
          }
        } catch (error: unknown) {
          const err = error as Error
          console.warn(
            `      ⚠️  Error guardando topo ${topoData.topoId}: ${err.message}`,
          )
        }
      }
    }

    console.log(`      ✅ Sector virtual creado: ${data.name} con ${data.routes!.length} rutas`)
  }

  /**
   * Save crag overview topos with sector positions
   */
  private async saveCragToposWithPositions(
    topos: TopoImageData[],
    cragId: CragId,
    result: ImportResult,
  ): Promise<void> {
    for (const topoData of topos) {
      try {
        const topoEntity = new CragTopoImageEntity(
          TopoImageId.generate(),
          topoData.topoId,
          cragId,
          topoData.thumbnailUrl,
          topoData.fullImageUrl,
          topoData.width,
          topoData.height,
          topoData.originalWidth,
          topoData.originalHeight,
          topoData.viewScale,
          null, // sourceUrl
        )

        // Build position data for each sector annotation
        const positions: CragTopoSectorPositionData[] = []
        for (const annotation of topoData.routes) {
          if (annotation.type === 'area') {
            positions.push({
              sectorId: null, // Will be linked later
              areaNumber: annotation.num,
              areaName: annotation.name,
              points: annotation.points,
              zindex: parseInt(annotation.zindex) || 0,
              order: annotation.order,
              externalAreaId: annotation.id ? BigInt(annotation.id) : null,
              areaUrl: annotation.url || null,
            })
          }
        }

        const { positionsCreated } =
          await this.topoRepo.saveCragTopoImageWithPositions(
            topoEntity,
            positions,
          )
        result.cragToposCreated++
        result.cragTopoPositionsCreated += positionsCreated

        console.log(
          `      ✅ Crag Topo ${topoData.topoId}: ${positionsCreated} sectores con SVG`,
        )
      } catch (error: unknown) {
        const err = error as Error
        console.warn(
          `      ⚠️  Error guardando crag topo ${topoData.topoId}: ${err.message}`,
        )
      }
    }
  }
}
