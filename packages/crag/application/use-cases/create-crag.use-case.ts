import { CragEntity } from '@crag/domain/entities/crag.entity'
import { CragPrismaRepository } from '@crag/infrastructure/persistence/prisma/crag.repository'
import { Inject, Injectable } from '@OneJs/core'

@Injectable()
export class CreateCragUseCase {
  constructor(
    @Inject(CragPrismaRepository)
    private readonly cragRepository: CragPrismaRepository,
  ) {}

  /**
   * Save a Crag entity by ID
   */
  async execute(entity: CragEntity): Promise<CragEntity> {
    return this.cragRepository.save(entity)
  }

  /**
   * Save by external ID (upsert - creates or updates based on externalId)
   */
  async upsert(entity: CragEntity): Promise<CragEntity> {
    return this.cragRepository.saveByExternalId(entity)
  }
}
