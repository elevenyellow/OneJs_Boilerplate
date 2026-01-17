import { Inject, Injectable } from '@OneJs/core'
import { RoutePrismaRepository } from '../../infrastructure/persistence/prisma/route.repository'
import type { RouteListItemDto } from '../../domain/dtos'
import { RouteToResponseMapper } from '../mappers/route-to-response.mapper'
import type { Id } from '@crags/domain/value-objects'

export interface GetCragRoutesResult {
  routes: RouteListItemDto[]
  totalCount: number
}

/**
 * Get routes directly associated with a crag (no sector)
 * Used for crags without sectors (virtual sectors case)
 * Returns gradeBand (numeric) - client converts to preferred grade system
 */
@Injectable()
export class GetCragRoutesUseCase {
  constructor(
    @Inject(RoutePrismaRepository)
    private readonly routeRepository: RoutePrismaRepository,
  ) {}

  async execute(cragId: Id): Promise<GetCragRoutesResult> {
    const routes = await this.routeRepository.findByCragIdWithoutSector(
      cragId.getValue(),
    )

    const routeDtos = RouteToResponseMapper.toListItemDtos(routes)

    return {
      routes: routeDtos,
      totalCount: routes.length,
    }
  }
}
