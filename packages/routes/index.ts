// Domain - Entities
export { Route } from './domain/entities/route.entity'

// Domain - DTOs
export {
  type RouteCreateDto,
  type RouteListItemDto,
  type RouteResponseDto,
  type ProtectionRating,
} from './domain/dtos'

// Application - Use Cases
export { GetSectorRoutesUseCase } from './application/use-cases/get-sector-routes.use-case'
export { GetCragRoutesUseCase } from './application/use-cases/get-crag-routes.use-case'

// Application - Mappers
export { RouteToResponseMapper } from './application/mappers/route-to-response.mapper'

// Domain - Value Objects
export {
  AkaNames,
  // Popularity
  Ascents,
  Bolts,
  Depth,
  // Description
  Description,
  Equipper,
  ExternalId,
  // First Ascent
  FirstAscent,
  GradeBand,
  GradeContext,
  GradeIndex,
  GradeStyle,
  // Core IDs
  Id,
  Maintainer,
  Pitches,
  Popularity,
  // Quality
  RawGrade,
  RouteFlags,
  // Grade
  RouteGrade,
  // Dimensions
  RouteHeight,
  // Identification
  RouteName,
  // Status
  RouteStatus,
  // Style & Equipment
  RouteStyle,
  // Metadata
  Seasonality,
  // Hierarchy
  SiblingLabel,
  Stars,
  Tags,
  // Topo
  TopoReference,
  UrlStub,
  Warnings,
  type RouteFlagsData,
  type TagsData,
  type WarningsData,
} from './domain/value-objects'

// Infrastructure - Repositories
export { RoutePrismaRepository } from './infrastructure/persistence/prisma/route.repository'
