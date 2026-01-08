import { Inject, Injectable } from '@OneJs/core'
import { ExternalId } from '@climb-zone/shared'
import { RoutePrismaRepository, type RouteFilter } from '@route/infrastructure/persistence/prisma/route.repository'
import { RouteId } from '@route/domain/value-objects/route-id.vo'
import { SectorId } from '@sector/domain/value-objects/sector-id.vo'
import type { RouteEntity } from '@route/domain/entities/route.entity'

@Injectable()
export class SearchRoutesUseCase {
  constructor(
    @Inject(RoutePrismaRepository)
    private readonly routeRepository: RoutePrismaRepository,
  ) {}

  async byId(id: RouteId): Promise<RouteEntity | null> {
    return this.routeRepository.findById(id)
  }

  async byExternalId(externalId: ExternalId): Promise<RouteEntity | null> {
    return this.routeRepository.findByExternalId(externalId)
  }

  async bySectorId(sectorId: SectorId): Promise<RouteEntity[]> {
    return this.routeRepository.findBySectorId(sectorId)
  }

  async byGradeRange(minGradeIndex: number, maxGradeIndex: number, limit?: number): Promise<RouteEntity[]> {
    return this.routeRepository.findByGradeRange(minGradeIndex, maxGradeIndex, limit)
  }

  async withFilters(filters: RouteFilter): Promise<RouteEntity[]> {
    return this.routeRepository.findWithFilters(filters)
  }

  async classics(limit?: number): Promise<RouteEntity[]> {
    return this.routeRepository.findClassics(limit)
  }

  async byName(query: string, limit?: number): Promise<RouteEntity[]> {
    return this.routeRepository.searchByName(query, limit)
  }
}
