// Domain - Entities
export { Sector } from './domain/entities/sector.entity'

// Domain - DTOs
export { type SectorCreateDto } from './domain/dtos'

// Domain - Value Objects
export {
  Approach,
  AverageHeight,
  Coordinates,
  ExternalId,
  Geometry,
  GradingSystem,
  HasSubSectors,
  HasTopo,
  Id,
  ImageUrl,
  Seasonality,
  SectorDepth,
  SectorName,
  SectorStats,
  SectorType,
  SectorTags,
  UrlStub,
  type GeometryData,
  type TagsData,
  type ParsedSectorTags,
  // Enums for atomic tag values
  AspectDirection,
  WalkInTime,
  FamilyFriendly,
  WeatherCondition,
  CrowdLevel,
  ClimbingStyle,
} from './domain/value-objects'

// Application - Use Cases
export { GetSectorDetailsWithHierarchyUseCase } from './application/use-cases/get-sector-details-with-hierarchy.use-case'
export type {
  GetSectorDetailsResult,
  SectorDto,
  SectorPhotoDto,
} from './application/use-cases/get-sector-details-with-hierarchy.use-case'

// Infrastructure - Repositories
export { SectorPrismaRepository } from './infrastructure/persistence/prisma/sector.repository'
