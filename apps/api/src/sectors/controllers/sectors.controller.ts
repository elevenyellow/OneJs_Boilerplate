import { Inject, logger, UseAuth } from '@OneJs/core'
import { Controller, Get, type Context } from '@OneJs/server'
import { Id } from '@sectors/domain/value-objects'
import { GetSectorRoutesUseCase } from '@routes/application/use-cases/get-sector-routes.use-case'
import { GetSectorDetailsWithHierarchyUseCase } from '@sectors/application/use-cases/get-sector-details-with-hierarchy.use-case'

/**
 * Controller for sector endpoints
 * Grade data is returned as gradeBand (numeric) - client converts to preferred system
 */
@Controller('/sectors')
export class SectorsController {
  constructor(
    @Inject(GetSectorRoutesUseCase)
    private readonly getSectorRoutesUseCase: GetSectorRoutesUseCase,
    @Inject(GetSectorDetailsWithHierarchyUseCase)
    private readonly getSectorDetailsUseCase: GetSectorDetailsWithHierarchyUseCase,
  ) {}

  @Get('/:sectorId/routes')
  @UseAuth()
  async getSectorRoutes(ctx: Context) {
    const { sectorId } = ctx.params as { sectorId: string }
    const sectorIdVo = Id.createFrom(sectorId)

    // Call both use cases in parallel
    // Grade data returned as gradeBand - client converts to preferred system
    const [sectorDetails, routesResult] = await Promise.all([
      this.getSectorDetailsUseCase.execute(sectorIdVo),
      this.getSectorRoutesUseCase.execute(sectorIdVo),
    ])

    logger.info('✅ [SectorsController] Sector with routes retrieved:', {
      sectorId,
      routesCount: routesResult.totalCount,
      childrenCount: sectorDetails.children.length,
      photosCount: sectorDetails.photos.length,
    })

    // Combine results into single response
    return {
      sector: sectorDetails.sector,
      parent: sectorDetails.parent,
      children: sectorDetails.children,
      photos: sectorDetails.photos,
      routes: routesResult.routes,
      totalCount: routesResult.totalCount,
    }
  }
}
