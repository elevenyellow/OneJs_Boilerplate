import { TopoPrismaRepository } from '@climb-zone/topo'
import { Inject } from '@OneJs/core'
import type { Context } from '@OneJs/server'
import { Controller, Get } from '@OneJs/server'
import { RouteId } from '@route/domain/value-objects/route-id.vo'
import { RoutePrismaRepository } from '@route/infrastructure/persistence/prisma/route.repository'

/**
 * Route Controller
 * Provides route-specific endpoints
 */
@Controller('/routes')
export class RouteController {
  constructor(
    @Inject(RoutePrismaRepository)
    private readonly routeRepository: RoutePrismaRepository,
    @Inject(TopoPrismaRepository)
    private readonly topoRepository: TopoPrismaRepository,
  ) {}

  /**
   * GET /api/routes/:id
   * Get route details
   */
  @Get('/:id')
  async getRoute(context: Context) {
    const { id } = context.params as { id: string }

    try {
      const routeId = RouteId.fromString(id)
      const route = await this.routeRepository.findById(routeId)

      if (!route) {
        context.set.status = 404
        return {
          success: false,
          error: {
            code: 'ROUTE_NOT_FOUND',
            message: `Route not found: ${id}`,
          },
        }
      }

      context.set.status = 200
      return route.toJSON()
    } catch {
      context.set.status = 400
      return {
        success: false,
        error: {
          code: 'INVALID_ROUTE_ID',
          message: `Invalid route ID: ${id}`,
        },
      }
    }
  }

  /**
   * GET /api/routes/:id/topos
   * Get all topo images that contain a specific route
   *
   * Response includes:
   * - Topo image URLs (thumbnail and full)
   * - Image dimensions
   * - All routes on each topo (to show context)
   * - The requested route is marked in the response
   */
  @Get('/:id/topos')
  async getRouteTopos(context: Context) {
    const { id } = context.params as { id: string }

    try {
      const routeId = RouteId.fromString(id)

      // Get all topos that contain this route
      const topoImages = await this.topoRepository.findToposForRoute(routeId)

      // For each topo, get all route positions
      const toposWithRoutes = await Promise.all(
        topoImages.map(async (topo) => {
          const positions = await this.topoRepository.findPositionsByTopoId(
            topo.id,
          )

          // Get route details for each position
          const routeIds = positions.map((p) => p.routeId)
          const routes = await Promise.all(
            routeIds.map((rId) => this.routeRepository.findById(rId)),
          )

          // Combine position data with route details
          const routesData = positions.map((position, idx) => {
            const route = routes[idx]
            return {
              routeId: position.routeId.toString(),
              routeExternalId: route?.externalId.toNumber() ?? 0,
              topoNumber: position.topoNumber,
              points: position.points,
              gradeClass: position.gradeClass,
              name: route?.name.toString() ?? 'Unknown',
              grade: route?.gradeString ?? null,
              isRequestedRoute: position.routeId.equals(routeId),
            }
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

      // 🚀 HTTP Cache headers
      context.set.headers = {
        ...context.set.headers,
        'Cache-Control': 'public, max-age=3600', // 1 hora
        Vary: 'Accept-Encoding',
      }

      context.set.status = 200
      return {
        routeId: id,
        topos: toposWithRoutes,
      }
    } catch {
      context.set.status = 400
      return {
        success: false,
        error: {
          code: 'INVALID_ROUTE_ID',
          message: `Invalid route ID: ${id}`,
        },
      }
    }
  }
}
