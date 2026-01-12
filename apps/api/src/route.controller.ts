import { GetToposWithRoutesUseCase } from '@climb-zone/topo'
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
    @Inject(GetToposWithRoutesUseCase)
    private readonly getToposWithRoutesUseCase: GetToposWithRoutesUseCase,
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
      const topos = await this.getToposWithRoutesUseCase.getByRouteId(id)

      // 🚀 HTTP Cache headers
      context.set.headers = {
        ...context.set.headers,
        'Cache-Control': 'public, max-age=3600', // 1 hora
        Vary: 'Accept-Encoding',
      }

      context.set.status = 200
      return {
        routeId: id,
        topos,
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
