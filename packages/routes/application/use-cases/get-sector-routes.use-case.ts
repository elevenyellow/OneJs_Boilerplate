import { Inject, Injectable } from '@OneJs/core'
import { RoutePrismaRepository } from '../../infrastructure/persistence/prisma/route.repository'
import type { RouteListItemDto } from '../../domain/dtos'
import { RouteToResponseMapper } from '../mappers/route-to-response.mapper'
import type { Id } from '@sectors/domain/value-objects'

export interface GetSectorRoutesResult {
  routes: RouteListItemDto[]
  totalCount: number
}

/**
 * Get routes for a sector
 * Returns gradeBand (numeric) - client converts to preferred grade system
 */
@Injectable()
export class GetSectorRoutesUseCase {
  constructor(
    @Inject(RoutePrismaRepository)
    private readonly routeRepository: RoutePrismaRepository,
  ) {}

  async execute(sectorId: Id): Promise<GetSectorRoutesResult> {
    const routes = await this.routeRepository.findBySectorId(sectorId)

    const routeDtos = RouteToResponseMapper.toListItemDtos(routes)

    return {
      routes: routeDtos,
      totalCount: routes.length,
    }
  }
}
