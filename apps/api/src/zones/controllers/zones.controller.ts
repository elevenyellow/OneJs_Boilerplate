import { Inject, logger, UseAuth } from '@OneJs/core'
import { Controller, Get, type Context } from '@OneJs/server'
import { GetZoneOverviewWithSectorsUseCase } from '@zones/application/use-cases/get-zone-overview-with-sectors.use-case'
import { ZoneId } from '@zones/domain/value-objects'

@Controller('/zones')
export class ZonesController {
  constructor(
    @Inject(GetZoneOverviewWithSectorsUseCase)
    private readonly getZoneOverviewUseCase: GetZoneOverviewWithSectorsUseCase,
  ) {}

  @Get('/:zoneId/overview')
  @UseAuth()
  async getZoneOverview(ctx: Context) {
    const { zoneId } = ctx.params as { zoneId: string }

    const result = await this.getZoneOverviewUseCase.execute(
      ZoneId.create(zoneId),
    )

    logger.info('✅ [ZonesController] Zone overview retrieved:', {
      zoneId,
      hasSectors: result.crag.hasSectors,
      sectorsCount: result.sectors.length,
      photosCount: result.photos.length,
    })

    return result
  }
}
