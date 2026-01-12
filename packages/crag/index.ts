// Domain - Entities
export { CragEntity } from './domain/entities/crag.entity'

// Domain - DTOs
export type {
  CragWithLocationDto,
  FindNearbyCragsDto,
  HeaderImageDto,
  HeaderImageS3Dto,
  NearbyCragsResultDto,
  OverviewTopoDto,
} from './domain/dtos/crag.dto'

// Domain - Value Objects
export { CragId } from './domain/value-objects/crag-id.vo'

// Re-export CountryId for convenience (CragEntity depends on it)
export { CountryId } from '@climb-zone/country'

// Domain - Events
export {
  CragCreatedEvent,
  CragUpdatedEvent,
} from './domain/events/crag-created.event'

// Application
export { CreateCragUseCase } from './application/use-cases/create-crag.use-case'
export {
  GetCragDetailUseCase,
  type CragDetailResponse,
  type RouteHighlight,
  type SectorSummary,
} from './application/use-cases/get-crag-detail.use-case'
export { GetCragUseCase } from './application/use-cases/get-crag.use-case'
export {
  GetNearbyCragsUseCase,
  type GetNearbyCragsDto,
  type GetNearbyCragsResponse,
  type NearbyCragResult,
} from './application/use-cases/get-nearby-crags.use-case'

// Infrastructure
export { CragPrismaRepository } from './infrastructure/persistence/prisma/crag.repository'
