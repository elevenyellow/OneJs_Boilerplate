import type { TopoAnnotationCreateDto } from '../dtos'
import {
  AnnotationColor,
  AnnotationGrade,
  AnnotationName,
  AnnotationNum,
  AnnotationOrder,
  AnnotationStars,
  AnnotationStyle,
  AnnotationType,
  AnnotationUrl,
  ExternalId,
  Id,
  SvgPath,
  ZIndex,
} from '../value-objects'

export type { TopoAnnotationCreateDto }

export class TopoAnnotation {
  private constructor(
    private readonly id: Id,
    private readonly topoId: Id,
    private readonly routeId: Id | null,
    private readonly externalRouteId: ExternalId | null,
    private readonly type: AnnotationType,
    private readonly num: AnnotationNum,
    private readonly order: AnnotationOrder,
    private readonly zindex: ZIndex,
    private readonly points: SvgPath,
    private readonly color: AnnotationColor,
    private readonly name: AnnotationName,
    private readonly grade: AnnotationGrade,
    private readonly stars: AnnotationStars,
    private readonly style: AnnotationStyle,
    private readonly url: AnnotationUrl,
  ) {}

  static create(dto: TopoAnnotationCreateDto): TopoAnnotation {
    return new TopoAnnotation(
      Id.createFrom(dto.id),
      Id.createFrom(dto.topoId),
      dto.routeId ? Id.createFrom(dto.routeId) : null,
      dto.externalRouteId ? ExternalId.createFrom(dto.externalRouteId) : null,
      AnnotationType.createFrom(dto.type),
      AnnotationNum.createFrom(dto.num),
      AnnotationOrder.createFrom(dto.order),
      ZIndex.createFrom(dto.zindex),
      SvgPath.createFrom(dto.points),
      AnnotationColor.createFrom(dto.color),
      AnnotationName.createFrom(dto.name),
      AnnotationGrade.createFrom(dto.grade, dto.gradeClass),
      AnnotationStars.createFrom(dto.stars),
      AnnotationStyle.createFrom(dto.style),
      AnnotationUrl.createFrom(dto.url),
    )
  }

  // Getters
  getId(): Id {
    return this.id
  }
  getTopoId(): Id {
    return this.topoId
  }
  getRouteId(): Id | null {
    return this.routeId
  }
  getExternalRouteId(): ExternalId | null {
    return this.externalRouteId
  }
  getType(): AnnotationType {
    return this.type
  }
  getNum(): AnnotationNum {
    return this.num
  }
  getOrder(): AnnotationOrder {
    return this.order
  }
  getZindex(): ZIndex {
    return this.zindex
  }
  getPoints(): SvgPath {
    return this.points
  }
  getColor(): AnnotationColor {
    return this.color
  }
  getName(): AnnotationName {
    return this.name
  }
  getGrade(): AnnotationGrade {
    return this.grade
  }
  getStars(): AnnotationStars {
    return this.stars
  }
  getStyle(): AnnotationStyle {
    return this.style
  }
  getUrl(): AnnotationUrl {
    return this.url
  }

  // Domain methods
  isRouteAnnotation(): boolean {
    return this.type.isRoute()
  }

  isAreaAnnotation(): boolean {
    return this.type.isArea()
  }

  hasRoute(): boolean {
    return this.routeId !== null || this.externalRouteId !== null
  }

  // Serialization
  toPrimitives(): TopoAnnotationCreateDto {
    return {
      id: this.id.getValue(),
      topoId: this.topoId.getValue(),
      routeId: this.routeId?.getValue() || null,
      externalRouteId: this.externalRouteId?.getValue() || null,
      type: this.type.getValue(),
      num: this.num.getValue(),
      order: this.order.getValue(),
      zindex: this.zindex.getValue(),
      points: this.points.getValue(),
      color: this.color.getValue(),
      name: this.name.getValue(),
      grade: this.grade.getGrade(),
      gradeClass: this.grade.getGradeClass(),
      stars: this.stars.getValue(),
      style: this.style.getValue(),
      url: this.url.getValue(),
    }
  }
}
