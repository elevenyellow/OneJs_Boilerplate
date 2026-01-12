import { CountryId } from '@climb-zone/country'
import { ExternalId } from '@climb-zone/shared'
import type { CragEntity } from '@crag/domain/entities/crag.entity'
import { CragId } from '@crag/domain/value-objects/crag-id.vo'
import { CragPrismaRepository } from '@crag/infrastructure/persistence/prisma/crag.repository'
import { Inject, Injectable } from '@OneJs/core'

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

  async byCountryId(countryId: CountryId): Promise<CragEntity[]> {
    return this.cragRepository.findByCountryId(countryId)
  }

  async all(): Promise<CragEntity[]> {
    return this.cragRepository.findAll()
  }
}
