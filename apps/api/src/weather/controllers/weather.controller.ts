import { Inject, OneJsError, UseAuth } from '@OneJs/core'
import { Controller, Get, type Context } from '@OneJs/server'
import { GetClimbingConditionsUseCase } from '@weather'
import type { ClimbingConditionsDto } from '@weather'
import { ErrorCodes } from '@OneJs/core'
import { CoordinatesResolverService } from '../application/services/coordinates-resolver.service'

@Controller('/weather')
export class WeatherController {
  constructor(
    @Inject(CoordinatesResolverService)
    private readonly coordinatesResolver: CoordinatesResolverService,

    @Inject(GetClimbingConditionsUseCase)
    private readonly getClimbingConditionsUseCase: GetClimbingConditionsUseCase,
  ) {}

  @Get('/conditions')
  @UseAuth()
  async getConditionsByCoordinates(
    ctx: Context,
  ): Promise<ClimbingConditionsDto> {
    const { lat, lon, aspect } = ctx.query as {
      lat?: string
      lon?: string
      aspect?: string
    }

    if (!lat || !lon) {
      throw new OneJsError(
        'Missing coordinates',
        400,
        'lat and lon query parameters are required',
        undefined,
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    const resolved = this.coordinatesResolver.resolveFromCoordinates(
      lat,
      lon,
      aspect || null,
    )

    return this.getClimbingConditionsUseCase.execute({
      latitude: resolved.latitude,
      longitude: resolved.longitude,
      aspect: resolved.aspect,
    })
  }

  @Get('/crags/:cragId')
  @UseAuth()
  async getConditionsForCrag(ctx: Context): Promise<ClimbingConditionsDto> {
    const { cragId } = ctx.params as { cragId: string }
    const { aspect } = ctx.query as { aspect?: string }

    if (!cragId) {
      throw new OneJsError(
        'Missing crag ID',
        400,
        'cragId path parameter is required',
        undefined,
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    const resolved = await this.coordinatesResolver.resolveFromCrag(
      cragId,
      aspect || null,
    )

    return this.getClimbingConditionsUseCase.execute({
      latitude: resolved.latitude,
      longitude: resolved.longitude,
      aspect: resolved.aspect,
      cragId: resolved.cragId,
    })
  }

  @Get('/sectors/:sectorId')
  @UseAuth()
  async getConditionsForSector(ctx: Context): Promise<ClimbingConditionsDto> {
    const { sectorId } = ctx.params as { sectorId: string }

    if (!sectorId) {
      throw new OneJsError(
        'Missing sector ID',
        400,
        'sectorId path parameter is required',
        undefined,
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    const resolved = await this.coordinatesResolver.resolveFromSector(sectorId)

    return this.getClimbingConditionsUseCase.execute({
      latitude: resolved.latitude,
      longitude: resolved.longitude,
      aspect: resolved.aspect,
      sectorId: resolved.sectorId,
    })
  }
}
