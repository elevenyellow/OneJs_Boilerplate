import { Inject, Injectable } from '@OneJs/core'
import { RouteId } from '@route/domain/value-objects/route-id.vo'
import { RoutePrismaRepository } from '@route/infrastructure/persistence/prisma/route.repository'
import { SectorId } from '@sector/domain/value-objects/sector-id.vo'
import { TopoPrismaRepository } from '@topo/infrastructure/persistence/prisma/topo.repository'

/**
 * Route data on a topo image
 */
export interface TopoRouteData {
  routeId: string
  routeExternalId: number
  topoNumber: string
  points: string
  gradeClass: string | null
  name: string
  grade: string | null
  isRequestedRoute?: boolean
}

/**
 * Topo image with route positions
 */
export interface TopoWithRoutes {
  id: string
  externalId: string
  sectorId: string
  thumbnailUrl: string
  fullImageUrl: string
  width: number
  height: number
  originalWidth: number
  originalHeight: number
  viewScale: number
  routes: TopoRouteData[]
}

/**
 * Use Case: Get topo images with route position data
 * Shared logic between SectorController and RouteController
 */
@Injectable()
export class GetToposWithRoutesUseCase {
  constructor(
    @Inject(TopoPrismaRepository)
    private readonly topoRepo: TopoPrismaRepository,
    @Inject(RoutePrismaRepository)
    private readonly routeRepo: RoutePrismaRepository,
  ) {}

  /**
   * Get all topos for a sector with route positions
   */
  async getBySectorId(sectorId: string): Promise<TopoWithRoutes[]> {
    const topoImages = await this.topoRepo.findBySectorId(
      SectorId.fromString(sectorId),
    )

    return this.enrichToposWithRoutes(topoImages)
  }

  /**
   * Get all topos that contain a specific route
   * The requested route is marked in the response
   */
  async getByRouteId(routeId: string): Promise<TopoWithRoutes[]> {
    const routeIdVo = RouteId.fromString(routeId)
    const topoImages = await this.topoRepo.findToposForRoute(routeIdVo)

    return this.enrichToposWithRoutes(topoImages, routeIdVo)
  }

  /**
   * Enrich topo images with route position data
   */
  private async enrichToposWithRoutes(
    topoImages: Array<{
      id: { toString(): string }
      externalId: string
      sectorId: { toString(): string }
      getThumbnailUrl(): string
      getFullImageUrl(): string
      width: number
      height: number
      originalWidth: number
      originalHeight: number
      viewScale: number
    }>,
    highlightRouteId?: RouteId,
  ): Promise<TopoWithRoutes[]> {
    return Promise.all(
      topoImages.map(async (topo) => {
        const positions = await this.topoRepo.findPositionsByTopoId(
          topo.id as any,
        )

        // Get route details for each position
        const routeIds = positions.map((p) => p.routeId)
        const routes = await Promise.all(
          routeIds.map((rId) => this.routeRepo.findById(rId)),
        )

        // Combine position data with route details
        const routesData: TopoRouteData[] = positions.map((position, idx) => {
          const route = routes[idx]
          const data: TopoRouteData = {
            routeId: position.routeId.toString(),
            routeExternalId: route?.externalId.toNumber() ?? 0,
            topoNumber: position.topoNumber,
            points: position.points,
            gradeClass: position.gradeClass,
            name: route?.name.toString() ?? 'Unknown',
            grade: route?.gradeString ?? null,
          }

          // Mark if this is the requested route
          if (highlightRouteId && position.routeId.equals(highlightRouteId)) {
            data.isRequestedRoute = true
          }

          return data
        })

        return {
          id: topo.id.toString(),
          externalId: topo.externalId,
          sectorId: topo.sectorId.toString(),
          thumbnailUrl: topo.getThumbnailUrl(),
          fullImageUrl: topo.getFullImageUrl(),
          width: topo.width,
          height: topo.height,
          originalWidth: topo.originalWidth,
          originalHeight: topo.originalHeight,
          viewScale: topo.viewScale,
          routes: routesData,
        }
      }),
    )
  }
}
