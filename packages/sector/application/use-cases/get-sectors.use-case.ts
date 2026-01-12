import { Inject, Injectable } from '@OneJs/core'
import { Coordinates, ExternalId } from '@climb-zone/shared'
import { AreaId } from '@area/domain/value-objects/area-id.vo'
import type {
  GradeRangeQueryDto,
  NearbySectorsQueryDto,
  SectorFilterDto,
} from '@sector/domain/dtos/search-sectors.dto'
import type { SectorEntity } from '@sector/domain/entities/sector.entity'
import { SectorId } from '@sector/domain/value-objects/sector-id.vo'
import { SectorPrismaRepository } from '@sector/infrastructure/persistence/prisma/sector.repository'

@Injectable()
export class GetSectorsUseCase {
  constructor(
    @Inject(SectorPrismaRepository)
    private readonly sectorRepository: SectorPrismaRepository,
  ) {}

  async byId(id: SectorId): Promise<SectorEntity | null> {
    return this.sectorRepository.findById(id)
  }

  async byExternalId(externalId: ExternalId): Promise<SectorEntity | null> {
    return this.sectorRepository.findByExternalId(externalId)
  }

  async byAreaId(areaId: AreaId): Promise<SectorEntity[]> {
    return this.sectorRepository.findByAreaId(areaId)
  }

  async byGradeRange(query: GradeRangeQueryDto): Promise<SectorEntity[]> {
    return this.sectorRepository.findByGradeRange(query)
  }

  async withFilters(filters: SectorFilterDto): Promise<SectorEntity[]> {
    return this.sectorRepository.findWithFilters(filters)
  }

  async nearby(coords: Coordinates, radiusKm?: number, limit?: number): Promise<SectorEntity[]> {
    const query: NearbySectorsQueryDto = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      radiusKm,
      limit,
    }
    return this.sectorRepository.findNearby(query)
  }
}
