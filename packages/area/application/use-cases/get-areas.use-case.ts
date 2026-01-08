import { Inject, Injectable } from '@OneJs/core'
import { ExternalId } from '@climb-zone/shared'
import { AreaPrismaRepository } from '@area/infrastructure/persistence/prisma/area.repository'
import { AreaId } from '@area/domain/value-objects/area-id.vo'
import { CragId } from '@crag/domain/value-objects/crag-id.vo'
import type { AreaEntity } from '@area/domain/entities/area.entity'

@Injectable()
export class GetAreasUseCase {
  constructor(
    @Inject(AreaPrismaRepository)
    private readonly areaRepository: AreaPrismaRepository,
  ) {}

  async byId(id: AreaId): Promise<AreaEntity | null> {
    return this.areaRepository.findById(id)
  }

  async byExternalId(externalId: ExternalId): Promise<AreaEntity | null> {
    return this.areaRepository.findByExternalId(externalId)
  }

  async byCragId(cragId: CragId): Promise<AreaEntity[]> {
    return this.areaRepository.findByCragId(cragId)
  }

  async rootAreasByCragId(cragId: CragId): Promise<AreaEntity[]> {
    return this.areaRepository.findRootAreasByCragId(cragId)
  }

  async childAreas(parentAreaId: AreaId): Promise<AreaEntity[]> {
    return this.areaRepository.findChildAreas(parentAreaId)
  }
}
