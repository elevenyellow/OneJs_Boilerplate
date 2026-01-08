import { Inject, Injectable } from '@OneJs/core'
import { ExternalId, Coordinates } from '@climb-zone/shared'
import { SectorPrismaRepository, type SectorFilter } from '@sector/infrastructure/persistence/prisma/sector.repository'
import { SectorId } from '@sector/domain/value-objects/sector-id.vo'
import { AreaId } from '@area/domain/value-objects/area-id.vo'
import type { SectorEntity } from '@sector/domain/entities/sector.entity'

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

  async byGradeRange(minGradeIndex: number, maxGradeIndex: number, limit?: number): Promise<SectorEntity[]> {
    return this.sectorRepository.findByGradeRange(minGradeIndex, maxGradeIndex, limit)
  }

  async withFilters(filters: SectorFilter): Promise<SectorEntity[]> {
    return this.sectorRepository.findWithFilters(filters)
  }

  async nearby(coords: Coordinates, radiusKm?: number, limit?: number): Promise<SectorEntity[]> {
    return this.sectorRepository.findNearby(coords.latitude, coords.longitude, radiusKm, limit)
  }
}
