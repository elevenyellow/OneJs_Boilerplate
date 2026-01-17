import type { SectorCreateDto } from '../dtos'
import {
  AltNames,
  Approach,
  AverageHeight,
  Beta,
  Coordinates,
  ExternalId,
  Geometry,
  GradeBands,
  HasSubSectors,
  HasTopo,
  Id,
  ImageUrl,
  Seasonality,
  SectorDepth,
  SectorName,
  SectorStats,
  SectorType,
  Styles,
  SectorTags,
  UrlStub,
} from '../value-objects'

export type { SectorCreateDto }

export class Sector {
  private constructor(
    private readonly id: Id,
    private readonly externalId: ExternalId,
    private readonly name: SectorName,
    private readonly sectorType: SectorType,
    private readonly urlStub: UrlStub,
    private readonly images: ImageUrl,
    private readonly approach: Approach,
    private readonly coordinates: Coordinates,
    private readonly geometry: Geometry,
    private readonly depth: SectorDepth,
    private readonly parentId: Id | null,
    private readonly cragId: Id,
    private readonly externalParentId: ExternalId | null,
    private readonly stats: SectorStats,
    private readonly averageHeight: AverageHeight,
    private readonly seasonality: Seasonality,
    private readonly tags: SectorTags,
    private readonly beta: Beta,
    private readonly styles: Styles,
    private readonly altNames: AltNames,
    private readonly gradeBands: GradeBands,
    private readonly hasTopo: HasTopo,
    private readonly hasSubSectors: HasSubSectors,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  static create(dto: SectorCreateDto): Sector {
    return new Sector(
      Id.createFrom(dto.id),
      ExternalId.createFrom(dto.externalId),
      SectorName.createFrom(dto.name, dto.asciiName),
      SectorType.createFrom(dto.type, dto.subType),
      UrlStub.createFrom(dto.urlStub, dto.urlAncestorStub),
      ImageUrl.createFrom(dto.headerImage, dto.coverImage, dto.thumbnail),
      Approach.createFrom(dto.approach),
      Coordinates.createFrom(dto.latitude, dto.longitude),
      Geometry.createFrom(dto.geometry),
      SectorDepth.createFrom(dto.depth),
      dto.parentId ? Id.createFrom(dto.parentId) : null,
      Id.createFrom(dto.cragId),
      dto.externalParentId ? ExternalId.createFrom(dto.externalParentId) : null,
      SectorStats.createFrom(
        dto.numberRoutes,
        dto.numberPhotos,
        dto.numberTopos,
        dto.ascentCount,
        dto.kudos,
        dto.subAreaCount,
        dto.maxPop,
      ),
      AverageHeight.createFrom(dto.averageHeight, dto.averageHeightUnit),
      Seasonality.createFrom(dto.seasonality),
      dto.tagAspect !== undefined
        ? SectorTags.createFromAtomic(
            dto.tags ?? null,
            dto.tagAspect ?? null,
            dto.tagWalkInTime ?? null,
            dto.tagFamily ?? null,
            dto.tagWeather ?? [],
            dto.tagCrowds ?? null,
            dto.tagStyle ?? null,
          )
        : SectorTags.createFrom(dto.tags),
      Beta.createFrom(dto.beta),
      Styles.createFrom(dto.styles),
      AltNames.createFrom(dto.altNames),
      GradeBands.createFrom(dto.gbRoutes),
      HasTopo.createFrom(dto.hasTopo),
      HasSubSectors.createFrom(dto.hasSubSectors),
      dto.createdAt ?? new Date(),
      dto.updatedAt ?? new Date(),
    )
  }

  // Getters
  getId(): Id {
    return this.id
  }

  getExternalId(): ExternalId {
    return this.externalId
  }

  getName(): SectorName {
    return this.name
  }

  getSectorType(): SectorType {
    return this.sectorType
  }

  getUrlStub(): UrlStub {
    return this.urlStub
  }

  getImages(): ImageUrl {
    return this.images
  }

  getApproach(): Approach {
    return this.approach
  }

  getCoordinates(): Coordinates {
    return this.coordinates
  }

  getGeometry(): Geometry {
    return this.geometry
  }

  getDepth(): SectorDepth {
    return this.depth
  }

  getParentId(): Id | null {
    return this.parentId
  }

  getCragId(): Id {
    return this.cragId
  }

  getExternalParentId(): ExternalId | null {
    return this.externalParentId
  }

  getStats(): SectorStats {
    return this.stats
  }

  getAverageHeight(): AverageHeight {
    return this.averageHeight
  }

  getSeasonality(): Seasonality {
    return this.seasonality
  }

  getTags(): SectorTags {
    return this.tags
  }

  getBeta(): Beta {
    return this.beta
  }

  getStyles(): Styles {
    return this.styles
  }

  getAltNames(): AltNames {
    return this.altNames
  }

  getGradeBands(): GradeBands {
    return this.gradeBands
  }

  getHasTopo(): HasTopo {
    return this.hasTopo
  }

  getHasSubSectors(): HasSubSectors {
    return this.hasSubSectors
  }

  getCreatedAt(): Date {
    return this.createdAt
  }

  getUpdatedAt(): Date {
    return this.updatedAt
  }

  // Domain methods
  isTopLevel(): boolean {
    return this.parentId === null
  }

  hasRoutes(): boolean {
    return this.stats.hasRoutes() && !this.hasSubSectors.getValue()
  }

  getTheCragUrl(): string | null {
    return this.urlStub.getTheCragUrl()
  }

  // Serialization
  toPrimitives(): SectorCreateDto {
    return {
      id: this.id.getValue(),
      externalId: this.externalId.getValue(),
      name: this.name.getValue(),
      asciiName: this.name.getAsciiValue(),
      type: this.sectorType.getType(),
      subType: this.sectorType.getSubType(),
      urlStub: this.urlStub.getUrlStub(),
      urlAncestorStub: this.urlStub.getUrlAncestorStub(),
      headerImage: this.images.getHeaderImage(),
      coverImage: this.images.getCoverImage(),
      thumbnail: this.images.getThumbnail(),
      approach: this.approach.getValue(),
      latitude: this.coordinates.getLatitude(),
      longitude: this.coordinates.getLongitude(),
      geometry: this.geometry.toJSON(),
      depth: this.depth.getValue(),
      parentId: this.parentId?.getValue() || null,
      cragId: this.cragId.getValue(),
      externalParentId: this.externalParentId?.getValue() || null,
      numberRoutes: this.stats.getNumberRoutes(),
      numberPhotos: this.stats.getNumberPhotos(),
      numberTopos: this.stats.getNumberTopos(),
      ascentCount: this.stats.getAscentCount(),
      kudos: this.stats.getKudos(),
      maxPop: this.stats.getMaxPop(),
      subAreaCount: this.stats.getSubAreaCount(),
      averageHeight: this.averageHeight.getValue(),
      averageHeightUnit: this.averageHeight.getUnit(),
      seasonality: this.seasonality.getMonths(),
      tags: this.tags.toJSON(),
      tagAspect: this.tags.getAspect(),
      tagWalkInTime: this.tags.getWalkInTime(),
      tagFamily: this.tags.getFamily(),
      tagWeather: this.tags.getWeather(),
      tagCrowds: this.tags.getCrowds(),
      tagStyle: this.tags.getStyle(),
      beta: this.beta.toJSON(),
      styles: this.styles.toJSON(),
      altNames: this.altNames.toJSON(),
      gbRoutes: this.gradeBands.getRoutes(),
      hasTopo: this.hasTopo.getValue(),
      hasSubSectors: this.hasSubSectors.getValue(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
