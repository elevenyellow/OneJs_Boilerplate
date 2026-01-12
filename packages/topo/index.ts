// Domain - Entities
export {
  CragTopoImageEntity,
  type CragTopoSectorPositionData,
} from './domain/entities/crag-topo-image.entity'
export { RouteTopoPositionEntity } from './domain/entities/route-topo-position.entity'
export { TopoImageEntity } from './domain/entities/topo-image.entity'

// Domain - Value Objects
export { ImageDimensions } from './domain/value-objects/image-dimensions.vo'
export { S3ImageUrls } from './domain/value-objects/s3-image-urls.vo'
export { TopoImageId } from './domain/value-objects/topo-image-id.vo'
export { TopoImageUrls } from './domain/value-objects/topo-image-urls.vo'
export { ViewScale } from './domain/value-objects/view-scale.vo'

// Domain - DTOs
export type {
  CragTopoSaveResultDto,
  CragTopoSectorPositionDto,
  CragTopoWithPositionsDto,
  RouteOnTopoDto,
  S3ImageUrlsDto,
  TopoSaveResultDto,
} from './domain/dtos/topo.dto'

// Application - Use Cases
export {
  GetToposWithRoutesUseCase,
  type TopoRouteData,
  type TopoWithRoutes,
} from './application/use-cases/get-topos-with-routes.use-case'

// Infrastructure - Repositories
export { TopoPrismaRepository } from './infrastructure/persistence/prisma/topo.repository'
