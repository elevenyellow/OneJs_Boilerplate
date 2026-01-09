// Domain - Entities
export { SectorEntity, type SectorType } from './domain/entities/sector.entity'

// Domain - Value Objects
export { SectorId } from './domain/value-objects/sector-id.vo'
export { SectorStats, type SectorStatsData, type GradeDistribution } from './domain/value-objects/sector-stats.vo'
export { PriceCategory } from './domain/value-objects/price-category.vo'
export { Kudos } from './domain/value-objects/kudos.vo'
export { Orientation } from './domain/value-objects/orientation.vo'
export { RockType } from './domain/value-objects/rock-type.vo'
export { ClimbingStyle } from './domain/value-objects/climbing-style.vo'
export { SunExposure } from './domain/value-objects/sun-exposure.vo'

// Application
export { GetSectorsUseCase } from './application/use-cases/get-sectors.use-case'
export { SectorStatsService, type RouteData } from './application/services/sector-stats.service'

// Infrastructure
export { SectorPrismaRepository, type SectorFilter } from './infrastructure/persistence/prisma/sector.repository'
