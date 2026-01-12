// Domain - Entities
export { CragEntity } from './domain/entities/crag.entity'

// Domain - Value Objects
export { CragId } from './domain/value-objects/crag-id.vo'

// Re-export CountryId for convenience (CragEntity depends on it)
export { CountryId } from '@climb-zone/country'

// Domain - Events
export { CragCreatedEvent, CragUpdatedEvent } from './domain/events/crag-created.event'

// Application
export { GetCragUseCase } from './application/use-cases/get-crag.use-case'
export { CreateCragUseCase } from './application/use-cases/create-crag.use-case'
export {
  GetCragDetailUseCase,
  type CragDetailResponse,
  type SectorSummary,
  type RouteHighlight,
} from './application/use-cases/get-crag-detail.use-case'
export {
  GetNearbyCragsUseCase,
  type GetNearbyCragsDto,
  type GetNearbyCragsResponse,
  type NearbyCragResult,
} from './application/use-cases/get-nearby-crags.use-case'

// Infrastructure
export { CragPrismaRepository } from './infrastructure/persistence/prisma/crag.repository'
