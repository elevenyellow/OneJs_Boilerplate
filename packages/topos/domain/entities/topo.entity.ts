import type { TopoCreateDto } from '../dtos'
import {
  ExternalId,
  HasRoutes,
  Id,
  ImageUrl,
  IsOverview,
  TopoDimensions,
  ViewScale,
} from '../value-objects'
import { TopoAnnotation } from './topo-annotation.entity'

export type { TopoCreateDto }

export class Topo {
  private constructor(
    private readonly id: Id,
    private readonly externalId: ExternalId,
    private readonly imageUrl: ImageUrl,
    private readonly dimensions: TopoDimensions,
    private readonly viewScale: ViewScale,
    private readonly isOverview: IsOverview,
    private readonly hasRoutes: HasRoutes,
    private readonly cragId: Id | null,
    private readonly sectorId: Id | null,
    private readonly annotations: TopoAnnotation[],
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  static create(dto: TopoCreateDto): Topo {
    const annotations = dto.annotations.map((a) => TopoAnnotation.create(a))

    return new Topo(
      Id.createFrom(dto.id),
      ExternalId.createFrom(dto.externalId),
      ImageUrl.createFrom(dto.thumbnailUrl, dto.fullImageUrl),
      TopoDimensions.createFrom(
        dto.width,
        dto.height,
        dto.originalWidth,
        dto.originalHeight,
      ),
      ViewScale.createFrom(dto.viewScale),
      IsOverview.createFrom(dto.isOverview),
      HasRoutes.createFrom(dto.hasRoutes),
      dto.cragId ? Id.createFrom(dto.cragId) : null,
      dto.sectorId ? Id.createFrom(dto.sectorId) : null,
      annotations,
      dto.createdAt,
      dto.updatedAt,
    )
  }

  // Getters
  getId(): Id {
    return this.id
  }
  getExternalId(): ExternalId {
    return this.externalId
  }
  getImageUrl(): ImageUrl {
    return this.imageUrl
  }
  getDimensions(): TopoDimensions {
    return this.dimensions
  }
  getViewScale(): ViewScale {
    return this.viewScale
  }
  getIsOverview(): IsOverview {
    return this.isOverview
  }
  getHasRoutes(): HasRoutes {
    return this.hasRoutes
  }
  getCragId(): Id | null {
    return this.cragId
  }
  getSectorId(): Id | null {
    return this.sectorId
  }
  getAnnotations(): TopoAnnotation[] {
    return [...this.annotations]
  }
  getCreatedAt(): Date {
    return this.createdAt
  }
  getUpdatedAt(): Date {
    return this.updatedAt
  }

  // Domain methods
  isCragTopo(): boolean {
    return this.cragId !== null && this.sectorId === null
  }

  isSectorTopo(): boolean {
    return this.sectorId !== null
  }

  hasAnnotations(): boolean {
    return this.annotations.length > 0
  }

  getRouteAnnotations(): TopoAnnotation[] {
    return this.annotations.filter((a) => a.isRouteAnnotation())
  }

  getAreaAnnotations(): TopoAnnotation[] {
    return this.annotations.filter((a) => a.isAreaAnnotation())
  }

  getAnnotationCount(): number {
    return this.annotations.length
  }

  // Serialization
  toPrimitives(): TopoCreateDto {
    return {
      id: this.id.getValue(),
      externalId: this.externalId.getValue(),
      thumbnailUrl: this.imageUrl.getThumbnailUrl(),
      fullImageUrl: this.imageUrl.getFullImageUrl(),
      width: this.dimensions.getWidth(),
      height: this.dimensions.getHeight(),
      originalWidth: this.dimensions.getOriginalWidth(),
      originalHeight: this.dimensions.getOriginalHeight(),
      viewScale: this.viewScale.getValue(),
      isOverview: this.isOverview.getValue(),
      hasRoutes: this.hasRoutes.getValue(),
      cragId: this.cragId?.getValue() || null,
      sectorId: this.sectorId?.getValue() || null,
      annotations: this.annotations.map((a) => a.toPrimitives()),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
