import { Inject, Injectable } from '@OneJs/core'
import type {
  TopoImageData,
  TopoRouteAnnotation,
} from '@the-crag/infrastructure/scraper/api.interfaces'
import type { TopoAnnotationCreateDto, TopoCreateDto } from '../../domain/dtos'
import { Topo } from '../../domain/entities/topo.entity'
import { ExternalId, Id, SvgPath } from '../../domain/value-objects'
import { TopoPrismaRepository } from '../../infrastructure/persistence/prisma/topo.repository'
import { Id as CragId } from '@crags/domain/value-objects'
import { Id as SectorId } from '@sectors/domain/value-objects'
import { GradeSystemDetector, GradeConverter, getGradeColor } from '@grades'
import type { AnnotationTypeValue } from '../../domain/value-objects/annotation-type.vo'

@Injectable()
export class ScrapedDataToTopoMapper {
  constructor(
    @Inject(TopoPrismaRepository)
    private readonly topoRepository: TopoPrismaRepository,
  ) {}

  /**
   * Maps scraped topo data to a Topo entity.
   *
   * @param data - The scraped topo image data
   * @param cragId - The crag ID
   * @param sectorId - The sector ID (optional)
   * @param isOverview - Whether this is an overview topo
   * @param validRouteExternalIds - Set of valid route external IDs from the sector.
   *   Used to validate and classify annotations:
   *   - Annotations of type 'area' are always kept
   *   - Annotations of type 'route' with closed polygons are reclassified to 'area'
   *   - Annotations of type 'route' matching a valid route ID are kept as 'route'
   *   - Annotations of type 'route' not matching any valid route ID are discarded
   */
  async mapFromScrapedData(
    data: TopoImageData,
    cragId: CragId,
    sectorId: SectorId | undefined,
    isOverview?: boolean,
    validRouteExternalIds?: Set<string | number>,
  ): Promise<Topo> {
    const externalId = ExternalId.createFrom(data.topoId)
    const existingTopo = await this.topoRepository.findByExternalId(externalId)

    if (existingTopo) {
      return this.mergeWithExisting(
        existingTopo,
        data,
        cragId,
        sectorId,
        isOverview,
        validRouteExternalIds,
      )
    }

    return this.createNew(
      data,
      cragId,
      sectorId,
      isOverview,
      validRouteExternalIds,
    )
  }

  private createNew(
    data: TopoImageData,
    cragId: CragId,
    sectorId: SectorId | undefined,
    isOverview?: boolean,
    validRouteExternalIds?: Set<string | number>,
  ): Topo {
    const topoId = Id.generateUniqueId().getValue()
    const annotations = this.mapAnnotations(
      data.routes,
      topoId,
      validRouteExternalIds,
    )

    // Calculate hasRoutes from annotations
    const hasRoutes = annotations.some((a) => a.type === 'route')

    const now = new Date()
    const dto: TopoCreateDto = {
      id: topoId,
      externalId: data.topoId,
      thumbnailUrl: data.thumbnailUrl,
      fullImageUrl: data.fullImageUrl,
      width: data.width,
      height: data.height,
      originalWidth: data.originalWidth,
      originalHeight: data.originalHeight,
      viewScale: data.viewScale,
      isOverview: isOverview ?? false,
      hasRoutes,
      cragId: cragId.toString() || null,
      sectorId: sectorId?.toString() || null,
      annotations,
      createdAt: now,
      updatedAt: now,
    }

    return Topo.create(dto)
  }

  private mergeWithExisting(
    existing: Topo,
    data: TopoImageData,
    cragId: CragId,
    sectorId: SectorId | undefined,
    isOverview?: boolean,
    validRouteExternalIds?: Set<string | number>,
  ): Topo {
    const existingDto = existing.toPrimitives()
    const annotations = this.mapAnnotations(
      data.routes,
      existingDto.id,
      validRouteExternalIds,
    )

    // Use new annotations if available, otherwise existing
    const finalAnnotations =
      annotations.length > 0 ? annotations : existingDto.annotations

    // Calculate hasRoutes from final annotations
    const hasRoutes = finalAnnotations.some((a) => a.type === 'route')

    const mergedDto: TopoCreateDto = {
      id: existingDto.id,
      externalId: existingDto.externalId,
      thumbnailUrl:
        this.mergeValue(existingDto.thumbnailUrl, data.thumbnailUrl) ||
        data.thumbnailUrl,
      fullImageUrl:
        this.mergeValue(existingDto.fullImageUrl, data.fullImageUrl) ||
        data.fullImageUrl,
      width: existingDto.width || data.width,
      height: existingDto.height || data.height,
      originalWidth: existingDto.originalWidth || data.originalWidth,
      originalHeight: existingDto.originalHeight || data.originalHeight,
      viewScale: existingDto.viewScale || data.viewScale,
      isOverview: existingDto.isOverview || isOverview || false,
      hasRoutes,
      cragId: this.mergeValue(existingDto.cragId, cragId.toString()),
      sectorId: this.mergeValue(existingDto.sectorId, sectorId?.toString()),
      annotations: finalAnnotations,
      createdAt: existingDto.createdAt,
      updatedAt: new Date(),
    }

    return Topo.create(mergedDto)
  }

  /**
   * Maps and filters/reclassifies annotations based on validation rules:
   * - Annotations of type 'area' are always kept
   * - Annotations of type 'route' with closed polygons are reclassified to 'area'
   * - Annotations of type 'route' matching a valid route ID are kept as 'route'
   * - Annotations of type 'route' not matching any valid route ID are discarded
   */
  private mapAnnotations(
    routes: TopoRouteAnnotation[],
    topoId: string,
    validRouteExternalIds?: Set<string | number>,
  ): TopoAnnotationCreateDto[] {
    const result: TopoAnnotationCreateDto[] = []

    for (const annotation of routes) {
      const classifiedType = this.classifyAnnotationType(
        annotation,
        validRouteExternalIds,
      )

      // null means the annotation should be discarded
      if (classifiedType === null) {
        continue
      }

      result.push({
        id: Id.generateUniqueId().getValue(),
        topoId: topoId,
        routeId: null,
        externalRouteId: annotation.id.toString(),
        type: classifiedType,
        num: annotation.num,
        order: annotation.order,
        zindex: annotation.zindex || null,
        points: annotation.points,
        color: this.getColorForGrade(annotation.grade),
        name: annotation.name,
        grade: annotation.grade || null,
        gradeClass: annotation.gradeClass || null,
        stars: annotation.stars || null,
        style: annotation.style || null,
        url: annotation.url || null,
      })
    }

    return result
  }

  /**
   * Classifies an annotation type based on validation rules.
   *
   * @returns The correct type ('route' | 'area') or null if the annotation should be discarded
   */
  private classifyAnnotationType(
    annotation: TopoRouteAnnotation,
    validRouteExternalIds?: Set<string | number>,
  ): AnnotationTypeValue | null {
    // Areas are always valid
    if (annotation.type === 'area') {
      return 'area'
    }

    // For annotations marked as 'route':
    const svgPath = SvgPath.createFrom(annotation.points)

    // If it's a closed polygon, it's actually an area (sector boundary)
    if (svgPath.isClosed()) {
      return 'area'
    }

    // If the path looks like an area boundary (rectangular, backtracking, etc.)
    // reclassify it as an area even if theCrag marked it as 'route'
    if (svgPath.looksLikeAreaBoundary()) {
      return 'area'
    }

    // If we have a list of valid route IDs, check if this annotation matches
    if (validRouteExternalIds && validRouteExternalIds.size > 0) {
      if (validRouteExternalIds.has(annotation.id)) {
        return 'route'
      }
      // Doesn't match any valid route - discard
      return null
    }

    // If no validation list provided (e.g., overview topos), keep as-is
    return 'route'
  }

  /**
   * Computes the color for a route based on its grade string.
   * Uses grade detection and conversion to get a universal index,
   * then maps to a color category.
   */
  private getColorForGrade(gradeString: string | null | undefined): string {
    if (!gradeString) {
      return '#6b7280' // Gray for unknown grades
    }

    try {
      const detection = GradeSystemDetector.detect(gradeString)
      const gradeIndex = GradeConverter.toIndex(
        detection.normalizedValue,
        detection.system,
      )
      return getGradeColor(gradeIndex)
    } catch {
      return '#6b7280' // Gray fallback on error
    }
  }

  private mergeValue<T>(
    existing: T | null | undefined,
    scraped: T | null | undefined,
  ): T | null {
    if (existing === null || existing === undefined || existing === '') {
      return (scraped ?? null) as T | null
    }
    return existing as T | null
  }
}
