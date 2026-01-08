import { Inject, Injectable } from '@OneJs/core'
import { CragPrismaRepository } from '@crag/infrastructure/persistence/prisma/crag.repository'
import { CragCreatedEvent } from '@crag/domain/events/crag-created.event'
import { CragEntity } from '@crag/domain/entities/crag.entity'

@Injectable()
export class CreateCragUseCase {
  constructor(
    @Inject(CragPrismaRepository)
    private readonly cragRepository: CragPrismaRepository,
  ) {}

  /**
   * Create or update a Crag entity
   */
  async execute(entity: CragEntity): Promise<CragEntity> {
    // Check if already exists by externalId
    const existing = await this.cragRepository.findByExternalId(entity.externalId)

    if (existing) {
      // Update existing
      existing.update({
        name: entity.name,
        country: entity.country,
        region: entity.region,
        geometry: entity.geometry,
        seasonality: entity.seasonality,
        description: entity.description,
        approach: entity.approach,
        ethic: entity.ethic,
        sourceUrl: entity.sourceUrl,
      })
      return this.cragRepository.save(existing)
    }

    // Create new
    return this.cragRepository.save(entity)
  }

  /**
   * Save by external ID (upsert)
   */
  async upsert(entity: CragEntity): Promise<CragEntity> {
    return this.cragRepository.saveByExternalId(entity)
  }
}
