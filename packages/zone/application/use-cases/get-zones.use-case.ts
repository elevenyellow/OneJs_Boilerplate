import { Inject, Injectable } from '@OneJs/core'
import { ZonePrismaRepository } from '@zone/infrastructure/persistence/prisma/zone.repository'
import type { ZoneFilterDto } from '../../domain/dtos/zone-filter.dto'
import type { ZoneListItemDto } from '../../domain/dtos/zone.dto'

@Injectable()
export class GetZonesUseCase {
  constructor(
    @Inject(ZonePrismaRepository)
    private readonly zoneRepository: ZonePrismaRepository,
  ) {}

  async execute(filters?: ZoneFilterDto): Promise<ZoneListItemDto[]> {
    const zones = await this.zoneRepository.findAll(filters)

    return zones.map((zone) => ({
      id: zone.id.toString(),
      name: zone.name,
      country: zone.country,
      region: zone.region,
      coordinates: zone.coordinates.toJSON(),
      climbingTypes: zone.climbingTypes,
      totalRoutes: zone.stats.totalRoutes,
      imageUrl: zone.imageUrl,
    }))
  }
}


