import { Inject, Injectable } from '@OneJs/core'
import { PrismaClientOneJs, PrismaRepository } from '@OneJs/prisma'
import { ExternalId, Grade, Name } from '@climb-zone/shared'
import type { TopRouteDto } from '@route/domain/dtos/route.dto'
import { RouteEntity } from '@route/domain/entities/route.entity'
import { Ascents } from '@route/domain/value-objects/ascents.vo'
import { Bolts } from '@route/domain/value-objects/bolts.vo'
import { FirstAscent } from '@route/domain/value-objects/first-ascent.vo'
import { Height } from '@route/domain/value-objects/height.vo'
import { Pitches } from '@route/domain/value-objects/pitches.vo'
import { Quality } from '@route/domain/value-objects/quality.vo'
import { Rating } from '@route/domain/value-objects/rating.vo'
import { RouteId } from '@route/domain/value-objects/route-id.vo'
import { RouteType } from '@route/domain/value-objects/route-type.vo'
import { Tags } from '@route/domain/value-objects/tags.vo'
import { TopoNumber } from '@route/domain/value-objects/topo-number.vo'
import { Warnings } from '@route/domain/value-objects/warnings.vo'
import { SectorId } from '@sector/domain/value-objects/sector-id.vo'

interface RoutePrismaData {
  id: string
  externalId: bigint
  sectorId: string
  name: string
  grade: string | null
  gradeIndex: number | null
  height: number | null
  pitches: number | null
  bolts: number | null
  stars: number | null
  quality: number | null
  ascents: number | null
  subType: string | null
  firstAscent: string | null
  tags: unknown
  warnings: unknown
  topoNumber: string | null
  createdAt: Date
}

export interface RouteFilter {
  sectorId?: SectorId
  minGradeIndex?: number
  maxGradeIndex?: number
  minStars?: number
  subType?: string
  limit?: number
  offset?: number
}

@Injectable()
export class RoutePrismaRepository extends PrismaRepository<'route'> {
  constructor(
    @Inject(PrismaClientOneJs) protected readonly prisma: PrismaClientOneJs,
  ) {
    super(prisma, 'route')
  }

  async findById(id: RouteId): Promise<RouteEntity | null> {
    const route = await this.prisma.route.findUnique({
      where: { id: id.toString() },
    })
    return route ? this.toEntity(route) : null
  }

  async findByExternalId(externalId: ExternalId): Promise<RouteEntity | null> {
    const route = await this.prisma.route.findUnique({
      where: { externalId: externalId.toBigInt() },
    })
    return route ? this.toEntity(route) : null
  }

  async findBySectorId(sectorId: SectorId): Promise<RouteEntity[]> {
    const routes = await this.prisma.route.findMany({
      where: { sectorId: sectorId.toString() },
      orderBy: { gradeIndex: 'asc' },
    })
    return routes.map((r: RoutePrismaData) => this.toEntity(r))
  }

  async findByGradeRange(
    minGradeIndex: number,
    maxGradeIndex: number,
    limit = 100,
  ): Promise<RouteEntity[]> {
    const routes = await this.prisma.route.findMany({
      where: {
        gradeIndex: {
          gte: minGradeIndex,
          lte: maxGradeIndex,
        },
      },
      orderBy: [{ stars: 'desc' }, { gradeIndex: 'asc' }],
      take: limit,
    })

    return routes.map((r: RoutePrismaData) => this.toEntity(r))
  }

  async findWithFilters(filters: RouteFilter): Promise<RouteEntity[]> {
    const where: Record<string, unknown> = {}

    if (filters.sectorId) {
      where.sectorId = filters.sectorId.toString()
    }

    if (filters.minGradeIndex !== undefined) {
      where.gradeIndex = {
        ...((where.gradeIndex as Record<string, unknown>) ?? {}),
        gte: filters.minGradeIndex,
      }
    }

    if (filters.maxGradeIndex !== undefined) {
      where.gradeIndex = {
        ...((where.gradeIndex as Record<string, unknown>) ?? {}),
        lte: filters.maxGradeIndex,
      }
    }

    if (filters.minStars !== undefined) {
      where.stars = { gte: filters.minStars }
    }

    if (filters.subType) {
      where.subType = filters.subType
    }

    const routes = await this.prisma.route.findMany({
      where,
      orderBy: [{ stars: 'desc' }, { gradeIndex: 'asc' }],
      take: filters.limit ?? 100,
      skip: filters.offset ?? 0,
    })

    return routes.map((r: RoutePrismaData) => this.toEntity(r))
  }

  async findClassics(limit = 50): Promise<RouteEntity[]> {
    const routes = await this.prisma.route.findMany({
      where: { stars: 3 },
      orderBy: [{ ascents: 'desc' }, { gradeIndex: 'asc' }],
      take: limit,
    })

    return routes.map((r: RoutePrismaData) => this.toEntity(r))
  }

  async searchByName(query: string, limit = 50): Promise<RouteEntity[]> {
    const routes = await this.prisma.route.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
      },
      orderBy: { stars: 'desc' },
      take: limit,
    })

    return routes.map((r: RoutePrismaData) => this.toEntity(r))
  }

  async save(entity: RouteEntity): Promise<RouteEntity> {
    const data = this.toPrismaData(entity)

    const saved = await this.prisma.route.upsert({
      where: { id: entity.id.toString() },
      create: data,
      update: data,
    })

    return this.toEntity(saved)
  }

  async saveByExternalId(entity: RouteEntity): Promise<RouteEntity> {
    const data = this.toPrismaData(entity)

    const saved = await this.prisma.route.upsert({
      where: { externalId: entity.externalId.toBigInt() },
      create: data,
      update: data,
    })

    return this.toEntity(saved)
  }

  async saveMany(entities: RouteEntity[]): Promise<number> {
    const data = entities.map((entity) => this.toPrismaData(entity))

    const result = await this.prisma.route.createMany({
      data,
      skipDuplicates: true,
    })

    return result.count
  }

  async delete(id: RouteId): Promise<void> {
    await this.prisma.route.delete({ where: { id: id.toString() } })
  }

  async deleteBySectorId(sectorId: SectorId): Promise<number> {
    const result = await this.prisma.route.deleteMany({
      where: { sectorId: sectorId.toString() },
    })
    return result.count
  }

  async countBySectorId(sectorId: SectorId): Promise<number> {
    return this.prisma.route.count({
      where: { sectorId: sectorId.toString() },
    })
  }

  /**
   * Find top routes across multiple sectors (by stars/ascents)
   * Returns route data with sector name for display
   */
  async findTopRoutesBySectorIds(
    sectorIds: SectorId[],
    limit = 15,
  ): Promise<TopRouteDto[]> {
    const sectorIdStrings = sectorIds.map((id) => id.toString())
    const routes = await this.prisma.route.findMany({
      where: {
        sectorId: { in: sectorIdStrings },
      },
      orderBy: [{ stars: 'desc' }, { ascents: 'desc' }],
      take: limit,
      include: {
        sector: {
          select: { name: true },
        },
      },
    })

    return routes.map((route) => ({
      id: route.id,
      name: route.name,
      grade: route.grade,
      gradeIndex: route.gradeIndex,
      stars: route.stars,
      ascents: route.ascents,
      height: route.height,
      routeType: route.subType,
      sectorId: route.sectorId,
      sectorName: route.sector.name,
    }))
  }

  async existsByExternalId(externalId: ExternalId): Promise<boolean> {
    const count = await this.prisma.route.count({
      where: { externalId: externalId.toBigInt() },
    })
    return count > 0
  }

  private toEntity(data: RoutePrismaData): RouteEntity {
    return new RouteEntity(
      RouteId.fromString(data.id),
      ExternalId.create(data.externalId),
      SectorId.fromString(data.sectorId),
      Name.create(data.name),
      data.grade
        ? new Grade(data.grade, 'french', data.gradeIndex ?? undefined)
        : null,
      Height.create(data.height),
      Pitches.create(data.pitches),
      Bolts.create(data.bolts),
      Rating.create(data.stars),
      Quality.create(data.quality),
      Ascents.create(data.ascents),
      RouteType.create(data.subType),
      FirstAscent.create(data.firstAscent),
      Tags.create(data.tags),
      Warnings.create(data.warnings),
      TopoNumber.create(data.topoNumber),
      data.createdAt,
    )
  }

  private toPrismaData(entity: RouteEntity) {
    return {
      id: entity.id.toString(),
      externalId: entity.externalId.toBigInt(),
      sectorId: entity.sectorId.toString(),
      name: entity.name.toString(),
      grade: entity.gradeString,
      gradeIndex: entity.gradeIndex,
      height: entity.height?.toNumber() ?? null,
      pitches: entity.pitches?.toNumber() ?? null,
      bolts: entity.bolts?.toNumber() ?? null,
      stars: entity.rating?.toNumber() ?? null,
      quality: entity.quality?.toNumber() ?? null,
      ascents: entity.ascents?.toNumber() ?? null,
      subType: entity.routeType?.toString() ?? null,
      firstAscent: entity.firstAscent?.toString() ?? null,
      tags: entity.tags.toJSON(),
      warnings: entity.warnings.toJSON(),
      topoNumber: entity.topoNumber?.toString() ?? null,
      createdAt: entity.createdAt,
    }
  }
}
