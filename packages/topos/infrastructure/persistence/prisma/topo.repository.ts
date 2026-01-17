import { Inject, Injectable } from '@OneJs/core'
import { PrismaClientOneJs, PrismaRepository } from '@OneJs/prisma'
import { Topo } from '@topos/domain/entities/topo.entity'
import { ExternalId, Id } from '@topos/domain/value-objects'
import { Id as CragId } from '@crags/domain/value-objects'
import { Id as SectorId } from '@sectors/domain/value-objects'
import { GradeSystemDetector, GradeConverter, getGradeColor } from '@grades'

@Injectable()
export class TopoPrismaRepository extends PrismaRepository<'topo'> {
  constructor(@Inject(PrismaClientOneJs) prisma: PrismaClientOneJs) {
    super(prisma, 'topo')
  }

  async findByExternalId(externalId: ExternalId): Promise<Topo | null> {
    const data = await this.findOne({
      where: { externalId: externalId.getValue() },
      include: { annotations: true },
    })

    if (!data) return null

    return this.mapToDomain(data)
  }

  async findOverviewTopos(cragId: Id): Promise<Topo[]> {
    const data = await this.findAll({
      where: {
        cragId: cragId.getValue(),
        isOverview: true,
      },
      include: { annotations: true },
    })

    return data.map((item: Record<string, unknown>) => this.mapToDomain(item))
  }

  async findByCragIdWithAnnotations(cragId: CragId): Promise<Topo[]> {
    const data = await this.findAll({
      where: {
        cragId: cragId.getValue(),
      },
      include: { annotations: true },
      orderBy: {
        isOverview: 'desc',
      },
    })

    return data.map((item: Record<string, unknown>) => this.mapToDomain(item))
  }

  async findBySectorIdWithAnnotations(sectorId: SectorId): Promise<Topo[]> {
    const data = await this.findAll({
      where: {
        sectorId: sectorId.getValue(),
      },
      include: { annotations: true },
      orderBy: {
        isOverview: 'desc',
      },
    })

    return data.map((item: Record<string, unknown>) => this.mapToDomain(item))
  }

  /**
   * Find topos for a sector that have route annotations.
   * Uses the hasRoutes flag for efficient DB-level filtering.
   */
  async findBySectorIdWithRouteAnnotations(
    sectorId: SectorId,
  ): Promise<Topo[]> {
    const data = await this.findAll({
      where: {
        sectorId: sectorId.getValue(),
        hasRoutes: true,
      },
      include: { annotations: true },
      orderBy: {
        isOverview: 'asc',
      },
    })

    return data.map((item: Record<string, unknown>) => this.mapToDomain(item))
  }

  async save(topo: Topo): Promise<Topo> {
    const primitives = topo.toPrimitives()

    // Calculate hasRoutes from annotations
    const hasRoutes =
      primitives.annotations?.some((a) => a.type === 'route') ?? false

    // First, upsert the topo
    const data = await this.model.upsert({
      where: { externalId: primitives.externalId },
      create: {
        id: primitives.id,
        externalId: primitives.externalId,
        thumbnailUrl: primitives.thumbnailUrl,
        fullImageUrl: primitives.fullImageUrl,
        width: primitives.width,
        height: primitives.height,
        originalWidth: primitives.originalWidth,
        originalHeight: primitives.originalHeight,
        viewScale: primitives.viewScale,
        isOverview: primitives.isOverview,
        hasRoutes,
        cragId: primitives.cragId,
        sectorId: primitives.sectorId,
      },
      update: {
        thumbnailUrl: primitives.thumbnailUrl,
        fullImageUrl: primitives.fullImageUrl,
        width: primitives.width,
        height: primitives.height,
        originalWidth: primitives.originalWidth,
        originalHeight: primitives.originalHeight,
        viewScale: primitives.viewScale,
        isOverview: primitives.isOverview,
        hasRoutes,
        cragId: primitives.cragId,
        sectorId: primitives.sectorId,
      },
      include: { annotations: true },
    })

    // Then handle annotations
    if (primitives.annotations && primitives.annotations.length > 0) {
      // Delete existing annotations
      await this.prisma.topoAnnotation.deleteMany({
        where: { topoId: data.id },
      })

      // Create new annotations
      await this.prisma.topoAnnotation.createMany({
        data: primitives.annotations.map((a) => ({
          id: a.id,
          topoId: data.id,
          routeId: a.routeId,
          externalRouteId: a.externalRouteId,
          type: a.type,
          num: a.num,
          order: a.order,
          zindex: a.zindex,
          points: a.points,
          color: a.color,
          name: a.name,
          grade: a.grade,
          gradeClass: a.gradeClass,
          stars: a.stars,
          style: a.style,
          url: a.url,
        })),
      })
    }

    // Fetch the complete topo with annotations
    const result = await this.findOne({
      where: { id: data.id },
      include: { annotations: true },
    })

    if (!result) {
      throw new Error(`Failed to fetch saved topo with id ${data.id}`)
    }

    return this.mapToDomain(result)
  }

  async existsByExternalId(externalId: ExternalId): Promise<boolean> {
    const count = await this.model.count({
      where: { externalId: externalId.getValue() },
    })
    return count > 0
  }

  private mapToDomain(data: Record<string, unknown>): Topo {
    return Topo.create({
      id: data.id as string,
      externalId: data.externalId as string,
      thumbnailUrl: data.thumbnailUrl as string,
      fullImageUrl: data.fullImageUrl as string,
      width: data.width as number,
      height: data.height as number,
      originalWidth: data.originalWidth as number,
      originalHeight: data.originalHeight as number,
      viewScale: data.viewScale as number,
      isOverview: data.isOverview as boolean,
      hasRoutes: data.hasRoutes as boolean,
      cragId: data.cragId as string | null,
      sectorId: data.sectorId as string | null,
      annotations: (data.annotations as Array<Record<string, unknown>>).map(
        (a: Record<string, unknown>) => ({
          id: a.id as string,
          topoId: a.topoId as string,
          routeId: a.routeId as string | null,
          externalRouteId: a.externalRouteId as string | null,
          type: a.type as string,
          num: a.num as string,
          order: a.order as number,
          zindex: a.zindex as string,
          points: a.points as string,
          // Use stored color if available, otherwise compute from grade (for legacy data)
          color:
            (a.color as string | null) ||
            this.getColorForGrade(a.grade as string | null),
          name: a.name as string,
          grade: a.grade as string | null,
          gradeClass: a.gradeClass as string | null,
          stars: a.stars as string | null,
          style: a.style as string | null,
          url: a.url as string | null,
        }),
      ),
      createdAt: data.createdAt as Date,
      updatedAt: data.updatedAt as Date,
    })
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
}
