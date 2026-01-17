import { Inject, Injectable } from '@OneJs/core'
import { PrismaClientOneJs, PrismaRepository } from '@OneJs/prisma'
import type { RouteCreateDto } from '../../../domain/dtos'
import { Route } from '../../../domain/entities/route.entity'
import { ExternalId } from '../../../domain/value-objects'
import type { Id } from '@sectors/domain/value-objects'

@Injectable()
export class RoutePrismaRepository extends PrismaRepository<'route'> {
  constructor(@Inject(PrismaClientOneJs) prisma: PrismaClientOneJs) {
    super(prisma, 'route')
  }

  async findByExternalId(externalId: ExternalId): Promise<Route | null> {
    const data = await this.model.findFirst({
      where: { externalId: externalId.getValue() },
    })

    if (!data) return null

    return this.mapToDomain(data)
  }

  async save(route: Route): Promise<Route> {
    const primitives = route.toPrimitives()

    const data = await this.model.upsert({
      where: { externalId: primitives.externalId.toString() },
      create: this.mapToPrisma(primitives),
      update: this.mapToPrisma(primitives),
    })

    return this.mapToDomain(data)
  }

  async existsByExternalId(externalId: ExternalId): Promise<boolean> {
    const count = await this.model.count({
      where: { externalId: externalId.getValue() },
    })
    return count > 0
  }

  async findBySectorId(sectorId: Id): Promise<Route[]> {
    const data = await this.prisma.route.findMany({
      where: { sectorId: sectorId.getValue() },
      orderBy: [{ siblingLabel: 'asc' }, { name: 'asc' }],
    })

    return data.map((row) => this.mapToDomain(row))
  }

  async findByCragId(cragId: string): Promise<Route[]> {
    const data = await this.model.findMany({
      where: { cragId },
      orderBy: [{ siblingLabel: 'asc' }, { name: 'asc' }],
    })

    return data.map((row) => this.mapToDomain(row))
  }

  /**
   * Find routes directly associated with a crag (no sector)
   * Used for crags with virtual sectors where routes have sectorId = null
   */
  async findByCragIdWithoutSector(cragId: string): Promise<Route[]> {
    const data = await this.model.findMany({
      where: {
        cragId,
        sectorId: null,
      },
      orderBy: [{ siblingLabel: 'asc' }, { name: 'asc' }],
    })

    return data.map((row) => this.mapToDomain(row))
  }

  private mapToDomain(data: any): Route {
    return Route.create({
      id: data.id,
      externalId: data.externalId,
      name: data.name,
      urlAncestorStub: data.urlAncestorStub,
      grade: data.grade,
      gradeBand: data.gradeBand,
      gradeStyle: data.gradeStyle,
      gradeInContext: data.gradeInContext,
      rawGradeMin: data.rawGradeMin,
      rawGradeMax: data.rawGradeMax,
      height: data.height,
      heightUnit: data.heightUnit,
      pitches: data.pitches,
      stars: data.stars,
      ascents: data.ascents,
      popularity: data.popularity,
      style: data.style,
      bolts: data.bolts,
      styleFlags: data.styleFlags,
      firstAscent: data.firstAscent,
      equipper: data.equipper,
      equipDate: data.equipDate,
      maintainer: data.maintainer,
      maintDate: data.maintDate,
      description: data.description,
      descriptionHtml: data.descriptionHtml,
      isClosed: data.isClosed,
      hasWarning: data.hasWarning,
      warningText: data.warningText,
      hasTopo: data.hasTopo,
      topoNumber: data.topoNumber,
      siblingLabel: data.siblingLabel,
      depth: data.depth,
      sectorId: data.sectorId,
      cragId: data.cragId,
      externalParentId: data.externalParentId,
      tags: data.tags,
      warnings: data.warnings,
      akaNames: data.akaNames,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    })
  }

  private mapToPrisma(dto: RouteCreateDto): any {
    return {
      id: dto.id,
      externalId: dto.externalId.toString(),
      name: dto.name,
      urlAncestorStub: dto.urlAncestorStub,
      grade: dto.grade,
      gradeBand: dto.gradeBand,
      gradeStyle: dto.gradeStyle,
      gradeInContext: dto.gradeInContext,
      rawGradeMin: dto.rawGradeMin,
      rawGradeMax: dto.rawGradeMax,
      height: dto.height,
      heightUnit: dto.heightUnit,
      pitches: dto.pitches,
      stars: dto.stars,
      ascents: dto.ascents,
      popularity: dto.popularity,
      style: dto.style,
      bolts: dto.bolts,
      styleFlags: dto.styleFlags ?? 0,
      firstAscent: dto.firstAscent,
      equipper: dto.equipper,
      equipDate: dto.equipDate,
      maintainer: dto.maintainer,
      maintDate: dto.maintDate,
      description: dto.description,
      descriptionHtml: dto.descriptionHtml,
      isClosed: dto.isClosed ?? false,
      hasWarning: dto.hasWarning ?? false,
      warningText: dto.warningText,
      hasTopo: dto.hasTopo ?? false,
      topoNumber: dto.topoNumber,
      siblingLabel: dto.siblingLabel,
      depth: dto.depth,
      sectorId: dto.sectorId,
      cragId: dto.cragId,
      externalParentId: dto.externalParentId,
      tags: dto.tags,
      warnings: dto.warnings,
      akaNames: dto.akaNames || [],
    }
  }
}
