// Domain - Entities
export { Crag } from './domain/entities/crag.entity'

// Domain - DTOs
export { type CragCreateDto } from './domain/dtos'

// Domain - Value Objects
export {
  AltNames,
  AverageHeight,
  Beta,
  Coordinates,
  CragName,
  CragStats,
  CragType,
  ExternalId,
  Geometry,
  GradeDistribution,
  HasSectors,
  HasTopo,
  Id,
  ImageUrl,
  Seasonality,
  Styles,
  Tags,
  UrlStub,
  type AltName,
  type BetaItem,
  type GeometryData,
  type StyleInfo,
  type TagItem,
  type TagsMap,
} from './domain/value-objects'

// Infrastructure - Repositories
export { CragPrismaRepository } from './infrastructure/persistence/prisma/crag.repository'
