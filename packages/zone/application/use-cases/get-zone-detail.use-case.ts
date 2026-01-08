import { Inject, Injectable, OneJsError } from '@OneJs/core'
import { ZonePrismaRepository } from '@zone/infrastructure/persistence/prisma/zone.repository'
import type { ZoneDetailDto } from '../../domain/dtos/zone.dto'

@Injectable()
export class GetZoneDetailUseCase {
  constructor(
    @Inject(ZonePrismaRepository)
    private readonly zoneRepository: ZonePrismaRepository,
  ) {}

  async execute(id: string): Promise<ZoneDetailDto> {
    const zone = await this.zoneRepository.findById(id)

    if (!zone) {
      throw new OneJsError('Zone not found', 404, 'ZONE_NOT_FOUND')
    }

    return {
      id: zone.id.toString(),
      name: zone.name,
      description: zone.description,
      country: zone.country,
      region: zone.region,
      coordinates: zone.coordinates.toJSON(),
      climbingTypes: zone.climbingTypes,
      gradeRange: zone.gradeRange,
      stats: zone.stats,
      theCragUrl: zone.theCragUrl,
      imageUrl: zone.imageUrl,
      altitude: zone.altitude,
      approach: zone.approach,
      bestSeasons: zone.bestSeasons,
      createdAt: zone.createdAt,
      updatedAt: zone.updatedAt,
    }
  }
}


