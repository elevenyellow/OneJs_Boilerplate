// Domain - Entities
export { SectorEntity, type SectorType } from './domain/entities/sector.entity'

// Domain - Value Objects
export { ClimbingStyle } from './domain/value-objects/climbing-style.vo'
export { Kudos } from './domain/value-objects/kudos.vo'
export { Orientation } from './domain/value-objects/orientation.vo'
export { PriceCategory } from './domain/value-objects/price-category.vo'
export { RockType } from './domain/value-objects/rock-type.vo'
export { SectorId } from './domain/value-objects/sector-id.vo'
export {
  SectorStats,
  type GradeDistribution,
  type SectorStatsData,
} from './domain/value-objects/sector-stats.vo'
export { SunExposure } from './domain/value-objects/sun-exposure.vo'

// Domain - DTOs
export type {
  AdvancedSearchFilters,
  SearchSectorResult,
  SearchSectorsDto,
  SearchSectorsResponse,
} from './domain/dtos/search-sectors.dto'

// Application
export { SectorScoringService } from './application/services/sector-scoring.service'
export {
  SectorStatsService,
  type RouteData,
} from './application/services/sector-stats.service'
export { GetSectorsUseCase } from './application/use-cases/get-sectors.use-case'
export { SearchSectorsUseCase } from './application/use-cases/search-sectors.use-case'

// Infrastructure
export {
  SectorPrismaRepository,
  type SectorFilter,
} from './infrastructure/persistence/prisma/sector.repository'
