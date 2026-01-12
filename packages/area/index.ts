// Domain - Entities
export { AreaEntity, type AreaType } from './domain/entities/area.entity'

// Domain - Value Objects
export { AreaId } from './domain/value-objects/area-id.vo'

// Application
export { GetAreasUseCase } from './application/use-cases/get-areas.use-case'
export { GetAreaDetailUseCase } from './application/use-cases/get-area-detail.use-case'

// Infrastructure
export { AreaPrismaRepository } from './infrastructure/persistence/prisma/area.repository'
