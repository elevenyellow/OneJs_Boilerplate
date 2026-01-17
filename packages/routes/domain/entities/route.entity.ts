import type { RouteCreateDto } from '../dtos'
import {
  AkaNames,
  Ascents,
  Bolts,
  Depth,
  Description,
  Equipper,
  ExternalId,
  FirstAscent,
  GradeBand,
  GradeContext,
  GradeStyle,
  Id,
  Maintainer,
  Pitches,
  Popularity,
  RawGrade,
  RouteGrade,
  RouteHeight,
  RouteName,
  RouteStatus,
  RouteStyle,
  SiblingLabel,
  Stars,
  StyleFlags,
  Tags,
  TopoReference,
  Warnings,
} from '../value-objects'

export type { RouteCreateDto }

export class Route {
  private constructor(
    private readonly id: Id,
    private readonly externalId: ExternalId,
    private readonly name: RouteName,
    // Grade
    private readonly grade: RouteGrade,
    private readonly gradeBand: GradeBand,
    private readonly gradeStyle: GradeStyle,
    private readonly gradeContext: GradeContext,
    private readonly rawGrade: RawGrade,
    // Dimensions
    private readonly height: RouteHeight,
    private readonly pitches: Pitches,
    // Quality
    private readonly stars: Stars,
    // Popularity
    private readonly ascents: Ascents,
    private readonly popularity: Popularity,
    // Style & Equipment
    private readonly routeStyle: RouteStyle,
    private readonly bolts: Bolts,
    private readonly styleFlags: StyleFlags,
    // First Ascent
    private readonly firstAscent: FirstAscent,
    private readonly equipper: Equipper,
    private readonly maintainer: Maintainer,
    // Description
    private readonly description: Description,
    // Status
    private readonly status: RouteStatus,
    // Topo
    private readonly topoReference: TopoReference,
    // Hierarchy
    private readonly siblingLabel: SiblingLabel,
    private readonly depth: Depth,
    private readonly sectorId: Id | null,
    private readonly cragId: Id,
    private readonly externalParentId: ExternalId | null,
    // Metadata
    private readonly tags: Tags,
    private readonly warnings: Warnings,
    private readonly akaNames: AkaNames,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  static create(dto: RouteCreateDto): Route {
    // Build style flags from numeric value or scraper data
    let styleFlags: StyleFlags
    if (dto.styleFlags !== undefined && dto.styleFlags !== null) {
      styleFlags = StyleFlags.createFrom(dto.styleFlags)
    } else if (dto.styleFlagsData) {
      styleFlags = StyleFlags.createFromData(dto.styleFlagsData)
    } else {
      styleFlags = StyleFlags.empty()
    }

    return new Route(
      Id.createFrom(dto.id),
      ExternalId.createFrom(dto.externalId),
      RouteName.createFrom(dto.name),
      // Grade
      RouteGrade.createFrom(dto.grade),
      GradeBand.createFrom(dto.gradeBand),
      GradeStyle.createFrom(dto.gradeStyle),
      GradeContext.createFrom(dto.gradeInContext),
      RawGrade.createFromValues(dto.rawGradeMin, dto.rawGradeMax),
      // Dimensions
      RouteHeight.createFrom(dto.height, dto.heightUnit),
      Pitches.createFrom(dto.pitches),
      // Quality
      Stars.createFrom(dto.stars),
      // Popularity
      Ascents.createFrom(dto.ascents),
      Popularity.createFrom(dto.popularity),
      // Style & Equipment
      RouteStyle.createFrom(dto.style),
      Bolts.createFrom(dto.bolts),
      styleFlags,
      // First Ascent
      FirstAscent.createFrom(dto.firstAscent),
      Equipper.createFrom(dto.equipper, dto.equipDate),
      Maintainer.createFrom(dto.maintainer, dto.maintDate),
      // Description
      Description.createFrom(dto.description, dto.descriptionHtml),
      // Status
      RouteStatus.createFrom(dto.isClosed, dto.hasWarning, dto.warningText),
      // Topo
      TopoReference.createFrom(dto.hasTopo, dto.topoNumber),
      // Hierarchy
      SiblingLabel.createFrom(dto.siblingLabel),
      Depth.createFrom(dto.depth),
      dto.sectorId ? Id.createFrom(dto.sectorId) : null,
      Id.createFrom(dto.cragId),
      dto.externalParentId ? ExternalId.createFrom(dto.externalParentId) : null,
      // Metadata
      Tags.createFrom(dto.tags),
      Warnings.createFrom(dto.warnings),
      AkaNames.createFrom(dto.akaNames),
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
  getName(): RouteName {
    return this.name
  }
  getGrade(): RouteGrade {
    return this.grade
  }
  getGradeBand(): GradeBand {
    return this.gradeBand
  }
  getGradeStyle(): GradeStyle {
    return this.gradeStyle
  }
  getGradeContext(): GradeContext {
    return this.gradeContext
  }
  getRawGrade(): RawGrade {
    return this.rawGrade
  }
  getHeight(): RouteHeight {
    return this.height
  }
  getPitches(): Pitches {
    return this.pitches
  }
  getStars(): Stars {
    return this.stars
  }
  getAscents(): Ascents {
    return this.ascents
  }
  getPopularity(): Popularity {
    return this.popularity
  }
  getRouteStyle(): RouteStyle {
    return this.routeStyle
  }
  getBolts(): Bolts {
    return this.bolts
  }
  getStyleFlags(): StyleFlags {
    return this.styleFlags
  }
  getFirstAscent(): FirstAscent {
    return this.firstAscent
  }
  getEquipper(): Equipper {
    return this.equipper
  }
  getMaintainer(): Maintainer {
    return this.maintainer
  }
  getDescription(): Description {
    return this.description
  }
  getStatus(): RouteStatus {
    return this.status
  }
  getTopoReference(): TopoReference {
    return this.topoReference
  }
  getSiblingLabel(): SiblingLabel {
    return this.siblingLabel
  }
  getDepth(): Depth {
    return this.depth
  }
  getSectorId(): Id | null {
    return this.sectorId
  }
  getCragId(): Id {
    return this.cragId
  }
  getExternalParentId(): ExternalId | null {
    return this.externalParentId
  }
  getTags(): Tags {
    return this.tags
  }
  getWarnings(): Warnings {
    return this.warnings
  }
  getAkaNames(): AkaNames {
    return this.akaNames
  }
  getCreatedAt(): Date {
    return this.createdAt
  }
  getUpdatedAt(): Date {
    return this.updatedAt
  }

  // Domain methods
  isSport(): boolean {
    return this.styleFlags.isSport()
  }
  isTrad(): boolean {
    return this.styleFlags.isTrad()
  }
  isBoulder(): boolean {
    return this.styleFlags.isBoulder()
  }
  isClimbable(): boolean {
    return this.status.isClimbable()
  }
  isClassic(): boolean {
    return this.stars.isClassic()
  }
  isMultiPitch(): boolean {
    return this.pitches.isMultiPitch()
  }

  // Serialization
  toPrimitives(): RouteCreateDto {
    return {
      id: this.id.getValue(),
      externalId: this.externalId.getValue(),
      name: this.name.getValue(),
      urlAncestorStub: null,
      grade: this.grade.getValue(),
      gradeBand: this.gradeBand.getValue(),
      gradeStyle: this.gradeStyle.getValue(),
      gradeInContext: this.gradeContext.getGradeInContext(),
      rawGradeMin: this.rawGrade.getMin(),
      rawGradeMax: this.rawGrade.getMax(),
      height: this.height.getValue(),
      heightUnit: this.height.getUnit(),
      pitches: this.pitches.getValue(),
      stars: this.stars.getValue(),
      ascents: this.ascents.getValue(),
      popularity: this.popularity.getPopularity(),
      style: this.routeStyle.getStyle(),
      bolts: this.bolts.getValue(),
      styleFlags: this.styleFlags.getValue(),
      firstAscent: this.firstAscent.getValue(),
      equipper: this.equipper.getName(),
      equipDate: this.equipper.getDate(),
      maintainer: this.maintainer.getName(),
      maintDate: this.maintainer.getDate(),
      description: this.description.getValue(),
      descriptionHtml: this.description.getHtmlValue(),
      isClosed: this.status.getIsClosed(),
      hasWarning: this.status.getHasWarning(),
      warningText: this.status.getWarningText(),
      hasTopo: this.topoReference.getHasTopo(),
      topoNumber: this.topoReference.getTopoNumber(),
      siblingLabel: this.siblingLabel.getValue(),
      depth: this.depth.getValue(),
      sectorId: this.sectorId?.getValue() || null,
      cragId: this.cragId.getValue(),
      externalParentId: this.externalParentId?.getValue() || null,
      tags: this.tags.toJSON(),
      warnings: this.warnings.toJSON(),
      akaNames: this.akaNames.getNames(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
