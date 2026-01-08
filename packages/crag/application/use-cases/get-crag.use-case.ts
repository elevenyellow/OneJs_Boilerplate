import { Inject, Injectable } from '@OneJs/core'
import { ExternalId } from '@climb-zone/shared'
import { CragPrismaRepository } from '@crag/infrastructure/persistence/prisma/crag.repository'
import { CragId } from '@crag/domain/value-objects/crag-id.vo'
import type { CragEntity } from '@crag/domain/entities/crag.entity'

@Injectable()
export class GetCragUseCase {
  constructor(
    @Inject(CragPrismaRepository)
    private readonly cragRepository: CragPrismaRepository,
  ) {}

  async byId(id: CragId): Promise<CragEntity | null> {
    return this.cragRepository.findById(id)
  }

  async byExternalId(externalId: ExternalId): Promise<CragEntity | null> {
    return this.cragRepository.findByExternalId(externalId)
  }

  async byCountry(country: string): Promise<CragEntity[]> {
    return this.cragRepository.findByCountry(country)
  }

  async all(): Promise<CragEntity[]> {
    return this.cragRepository.findAll()
  }

  async getCountries(): Promise<string[]> {
    return this.cragRepository.getCountries()
  }
}
