import type { CragCreateDto } from '../dtos'
import {
  AltNames,
  AreaSize,
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
  PopularityScore,
  QualityRating,
  Seasonality,
  Styles,
  Tags,
  UrlStub,
} from '../value-objects'

export type { CragCreateDto }

export class Crag {
  private constructor(
    private readonly id: Id,
    private readonly externalId: ExternalId,
    private readonly zoneId: Id,
    private readonly name: CragName,
    private readonly cragType: CragType,
    private readonly urlStub: UrlStub,
    private readonly headerImage: ImageUrl,
    private readonly coordinates: Coordinates,
    private readonly areaSize: AreaSize,
    private readonly geometry: Geometry,
    private readonly stats: CragStats,
    private readonly gradeDistribution: GradeDistribution,
    private readonly averageHeight: AverageHeight,
    private readonly seasonality: Seasonality,
    private readonly beta: Beta,
    private readonly styles: Styles,
    private readonly tags: Tags,
    private readonly altNames: AltNames,
    private readonly hasTopo: HasTopo,
    private readonly hasSectors: HasSectors,
    private readonly qualityRating: QualityRating,
    private readonly popularityScore: PopularityScore,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  static create(dto: CragCreateDto): Crag {
    return new Crag(
      Id.createFrom(dto.id),
      ExternalId.createFrom(dto.externalId),
      Id.createFrom(dto.zoneId),
      CragName.createFrom(dto.name, dto.asciiName),
      CragType.createFrom(dto.type, dto.subType),
      UrlStub.createFrom(dto.urlStub, dto.urlAncestorStub),
      ImageUrl.createFrom(dto.headerImage),
      Coordinates.createFrom(dto.latitude, dto.longitude),
      AreaSize.createFrom(dto.areaSize),
      Geometry.createFrom(dto.geometry),
      CragStats.createFrom(
        dto.numberRoutes,
        dto.numberPhotos,
        dto.numberTopos,
        dto.ascentCount,
        dto.kudos,
        dto.overallScore,
      ),
      GradeDistribution.createFrom(dto.gbRoutes),
      AverageHeight.createFrom(dto.averageHeight, dto.averageHeightUnit),
      Seasonality.createFrom(dto.seasonality),
      Beta.createFrom(dto.beta),
      Styles.createFrom(dto.styles),
      Tags.createFrom(dto.tags),
      AltNames.createFrom(dto.altNames),
      HasTopo.createFrom(dto.hasTopo),
      HasSectors.createFrom(dto.hasSectors),
      QualityRating.createFrom(dto.qualityRating),
      PopularityScore.createFrom(dto.popularityScore),
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

  getZoneId(): Id {
    return this.zoneId
  }

  getName(): CragName {
    return this.name
  }

  getCragType(): CragType {
    return this.cragType
  }

  getUrlStub(): UrlStub {
    return this.urlStub
  }

  getHeaderImage(): ImageUrl {
    return this.headerImage
  }

  getCoordinates(): Coordinates {
    return this.coordinates
  }

  getAreaSize(): AreaSize {
    return this.areaSize
  }

  getGeometry(): Geometry {
    return this.geometry
  }

  getStats(): CragStats {
    return this.stats
  }

  getGradeDistribution(): GradeDistribution {
    return this.gradeDistribution
  }

  getAverageHeight(): AverageHeight {
    return this.averageHeight
  }

  getSeasonality(): Seasonality {
    return this.seasonality
  }

  getBeta(): Beta {
    return this.beta
  }

  getStyles(): Styles {
    return this.styles
  }

  getTags(): Tags {
    return this.tags
  }

  getAltNames(): AltNames {
    return this.altNames
  }

  getHasTopo(): HasTopo {
    return this.hasTopo
  }

  getHasSectors(): HasSectors {
    return this.hasSectors
  }

  getQualityRating(): QualityRating {
    return this.qualityRating
  }

  getPopularityScore(): PopularityScore {
    return this.popularityScore
  }

  getCreatedAt(): Date {
    return this.createdAt
  }

  getUpdatedAt(): Date {
    return this.updatedAt
  }

  // Domain methods
  hasCoordinates(): boolean {
    return this.coordinates.hasCoordinates()
  }

  isGoodSeasonNow(): boolean {
    return this.seasonality.isGoodNow()
  }

  getDominantStyle(): string | null {
    return this.styles.getDominantStyle()
  }

  getApproach(): string | null {
    return this.beta.getApproach()
  }

  getDescription(): string | null {
    return this.beta.getDescription()
  }

  getTheCragUrl(): string | null {
    return this.urlStub.getTheCragUrl()
  }

  getNumberRoutes(): number | null {
    return this.stats.getNumberRoutes()
  }

  // Serialization
  toPrimitives(): CragCreateDto {
    return {
      id: this.id.getValue(),
      externalId: this.externalId.getValue(),
      zoneId: this.zoneId.getValue(),
      name: this.name.getValue(),
      asciiName: this.name.getAsciiValue(),
      type: this.cragType.getType(),
      subType: this.cragType.getSubType(),
      urlStub: this.urlStub.getUrlStub(),
      urlAncestorStub: this.urlStub.getUrlAncestorStub(),
      headerImage: this.headerImage.getValue(),
      latitude: this.coordinates.getLatitude(),
      longitude: this.coordinates.getLongitude(),
      areaSize: this.areaSize.getValue(),
      geometry: this.geometry.toJSON(),
      numberRoutes: this.stats.getNumberRoutes(),
      numberPhotos: this.stats.getNumberPhotos(),
      numberTopos: this.stats.getNumberTopos(),
      ascentCount: this.stats.getAscentCount(),
      kudos: this.stats.getKudos(),
      averageHeight: this.averageHeight.getValue(),
      averageHeightUnit: this.averageHeight.getUnit(),
      gbRoutes: this.gradeDistribution.getGbRoutes(),
      beta: this.beta.toJSON(),
      styles: this.styles.toJSON(),
      tags: this.tags.toJSON(),
      altNames: this.altNames.toJSON(),
      seasonality: this.seasonality.getMonths(),
      hasTopo: this.hasTopo.getValue(),
      hasSectors: this.hasSectors.getValue(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
