import { Inject, Injectable } from '@OneJs/core'
import { PrismaClientOneJs, PrismaRepository } from '@OneJs/prisma'
import {
  BetaInfo,
  ExternalId,
  Geometry,
  Name,
  Seasonality,
  type BetaItemData,
} from '@climb-zone/shared'
import { SectorEntity, type SectorType } from '@sector/domain/entities/sector.entity'
import { SectorId } from '@sector/domain/value-objects/sector-id.vo'
import {
  SectorStats,
  type GradeDistribution,
} from '@sector/domain/value-objects/sector-stats.vo'
import { PriceCategory } from '@sector/domain/value-objects/price-category.vo'
import { Kudos } from '@sector/domain/value-objects/kudos.vo'
import { AreaId } from '@area/domain/value-objects/area-id.vo'

interface SectorPrismaData {
  id: string
  externalId: bigint
  areaId: string
  name: string
  type: string
  latitude: number | null
  longitude: number | null
  geometry: unknown
  seasonality: number[]
  beta: unknown
  routeCount: number
  minGrade: string | null
  maxGrade: string | null
  minGradeIndex: number | null
  maxGradeIndex: number | null
  gradeDistribution: unknown
  averageHeight: number | null
  totalAscents: number | null
  priceCategory: string | null
  hasTopo: boolean
  kudos: number | null
  createdAt: Date
  updatedAt: Date
}

export interface SectorFilter {
  areaId?: AreaId
  minGradeIndex?: number
  maxGradeIndex?: number
  minRoutes?: number
  hasTopo?: boolean
  limit?: number
  offset?: number
}

@Injectable()
export class SectorPrismaRepository extends PrismaRepository<'sector'> {
  constructor(
    @Inject(PrismaClientOneJs) protected readonly prisma: PrismaClientOneJs,
  ) {
    super(prisma, 'sector')
  }

  async findById(id: SectorId): Promise<SectorEntity | null> {
    const sector = await this.prisma.sector.findUnique({
      where: { id: id.toString() },
    })
    return sector ? this.toEntity(sector) : null
  }

  async findByExternalId(externalId: ExternalId): Promise<SectorEntity | null> {
    const sector = await this.prisma.sector.findUnique({
      where: { externalId: externalId.toBigInt() },
    })
    return sector ? this.toEntity(sector) : null
  }

  async findByAreaId(areaId: AreaId): Promise<SectorEntity[]> {
    const sectors = await this.prisma.sector.findMany({
      where: { areaId: areaId.toString() },
      orderBy: { name: 'asc' },
    })
    return sectors.map((s: SectorPrismaData) => this.toEntity(s))
  }

  async findByGradeRange(
    minGradeIndex: number,
    maxGradeIndex: number,
    limit = 50,
  ): Promise<SectorEntity[]> {
    const sectors = await this.prisma.sector.findMany({
      where: {
        AND: [
          { minGradeIndex: { lte: maxGradeIndex } },
          { maxGradeIndex: { gte: minGradeIndex } },
        ],
      },
      orderBy: { routeCount: 'desc' },
      take: limit,
    })

    return sectors.map((s: SectorPrismaData) => this.toEntity(s))
  }

  async findWithFilters(filters: SectorFilter): Promise<SectorEntity[]> {
    const where: Record<string, unknown> = {}

    if (filters.areaId) {
      where.areaId = filters.areaId.toString()
    }

    if (filters.minGradeIndex !== undefined) {
      where.maxGradeIndex = { gte: filters.minGradeIndex }
    }

    if (filters.maxGradeIndex !== undefined) {
      where.minGradeIndex = { lte: filters.maxGradeIndex }
    }

    if (filters.minRoutes !== undefined) {
      where.routeCount = { gte: filters.minRoutes }
    }

    if (filters.hasTopo !== undefined) {
      where.hasTopo = filters.hasTopo
    }

    const sectors = await this.prisma.sector.findMany({
      where,
      orderBy: { routeCount: 'desc' },
      take: filters.limit ?? 50,
      skip: filters.offset ?? 0,
    })

    return sectors.map((s: SectorPrismaData) => this.toEntity(s))
  }

  async findNearby(
    latitude: number,
    longitude: number,
    radiusKm: number = 50,
    limit: number = 20,
  ): Promise<SectorEntity[]> {
    const latDelta = radiusKm / 111
    const lonDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180))

    const sectors = await this.prisma.sector.findMany({
      where: {
        latitude: {
          gte: latitude - latDelta,
          lte: latitude + latDelta,
        },
        longitude: {
          gte: longitude - lonDelta,
          lte: longitude + lonDelta,
        },
      },
      orderBy: { routeCount: 'desc' },
      take: limit,
    })

    return sectors.map((s: SectorPrismaData) => this.toEntity(s))
  }

  async save(entity: SectorEntity): Promise<SectorEntity> {
    const data = this.toPrismaData(entity)

    const saved = await this.prisma.sector.upsert({
      where: { id: entity.id.toString() },
      create: data,
      update: {
        ...data,
        updatedAt: new Date(),
      },
    })

    return this.toEntity(saved)
  }

  async saveByExternalId(entity: SectorEntity): Promise<SectorEntity> {
    const data = this.toPrismaData(entity)

    const saved = await this.prisma.sector.upsert({
      where: { externalId: entity.externalId.toBigInt() },
      create: data,
      update: {
        ...data,
        updatedAt: new Date(),
      },
    })

    return this.toEntity(saved)
  }

  async updateStats(entity: SectorEntity): Promise<void> {
    const stats = entity.stats

    await this.prisma.sector.update({
      where: { id: entity.id.toString() },
      data: {
        routeCount: stats.routeCount,
        minGrade: stats.minGrade,
        maxGrade: stats.maxGrade,
        minGradeIndex: stats.minGradeIndex,
        maxGradeIndex: stats.maxGradeIndex,
        gradeDistribution: stats.gradeDistribution,
        averageHeight: stats.averageHeight,
        totalAscents: stats.totalAscents,
        updatedAt: new Date(),
      },
    })
  }

  async delete(id: SectorId): Promise<void> {
    await this.prisma.sector.delete({ where: { id: id.toString() } })
  }

  async deleteByAreaId(areaId: AreaId): Promise<number> {
    const result = await this.prisma.sector.deleteMany({
      where: { areaId: areaId.toString() },
    })
    return result.count
  }

  async existsByExternalId(externalId: ExternalId): Promise<boolean> {
    const count = await this.prisma.sector.count({
      where: { externalId: externalId.toBigInt() },
    })
    return count > 0
  }

  private toEntity(data: SectorPrismaData): SectorEntity {
    return new SectorEntity(
      SectorId.fromString(data.id),
      ExternalId.create(data.externalId),
      AreaId.fromString(data.areaId),
      Name.create(data.name),
      data.type as SectorType,
      Geometry.fromJSON(data.geometry as Record<string, unknown>),
      Seasonality.create(data.seasonality),
      BetaInfo.fromJSON(data.beta as BetaItemData[]),
      new SectorStats(
        data.routeCount,
        data.minGrade,
        data.maxGrade,
        data.minGradeIndex,
        data.maxGradeIndex,
        (data.gradeDistribution as GradeDistribution) ?? {},
        data.averageHeight,
        data.totalAscents,
      ),
      PriceCategory.create(data.priceCategory),
      data.hasTopo,
      Kudos.create(data.kudos),
      data.createdAt,
      data.updatedAt,
    )
  }

  private toPrismaData(entity: SectorEntity) {
    return {
      id: entity.id.toString(),
      externalId: entity.externalId.toBigInt(),
      areaId: entity.areaId.toString(),
      name: entity.name.toString(),
      type: entity.type,
      latitude: entity.latitude,
      longitude: entity.longitude,
      geometry: entity.geometry?.toJSON() ?? null,
      seasonality: entity.seasonality.toArray(),
      beta: entity.beta.toJSON(),
      routeCount: entity.stats.routeCount,
      minGrade: entity.stats.minGrade,
      maxGrade: entity.stats.maxGrade,
      minGradeIndex: entity.stats.minGradeIndex,
      maxGradeIndex: entity.stats.maxGradeIndex,
      gradeDistribution: entity.stats.gradeDistribution,
      averageHeight: entity.stats.averageHeight,
      totalAscents: entity.stats.totalAscents,
      priceCategory: entity.priceCategory?.toString() ?? null,
      hasTopo: entity.hasTopo,
      kudos: entity.kudos?.toNumber() ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }
  }
}
