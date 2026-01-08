import { Inject, Injectable } from '@OneJs/core'
import { PrismaClientOneJs, PrismaRepository } from '@OneJs/prisma'
import {
  BetaInfo,
  ExternalId,
  Geometry,
  Name,
  type BetaItemData,
} from '@climb-zone/shared'
import { AreaEntity, type AreaType } from '@area/domain/entities/area.entity'
import { AreaId } from '@area/domain/value-objects/area-id.vo'
import { CragId } from '@crag/domain/value-objects/crag-id.vo'

interface AreaPrismaData {
  id: string
  externalId: bigint
  cragId: string
  parentAreaId: string | null
  name: string
  type: string
  latitude: number | null
  longitude: number | null
  geometry: unknown
  beta: unknown
  createdAt: Date
  updatedAt: Date
}

@Injectable()
export class AreaPrismaRepository extends PrismaRepository<'area'> {
  constructor(
    @Inject(PrismaClientOneJs) protected readonly prisma: PrismaClientOneJs,
  ) {
    super(prisma, 'area')
  }

  async findById(id: AreaId): Promise<AreaEntity | null> {
    const area = await this.prisma.area.findUnique({
      where: { id: id.toString() },
    })
    return area ? this.toEntity(area) : null
  }

  async findByExternalId(externalId: ExternalId): Promise<AreaEntity | null> {
    const area = await this.prisma.area.findUnique({
      where: { externalId: externalId.toBigInt() },
    })
    return area ? this.toEntity(area) : null
  }

  async findByCragId(cragId: CragId): Promise<AreaEntity[]> {
    const areas = await this.prisma.area.findMany({
      where: { cragId: cragId.toString() },
      orderBy: { name: 'asc' },
    })
    return areas.map((area: AreaPrismaData) => this.toEntity(area))
  }

  async findRootAreasByCragId(cragId: CragId): Promise<AreaEntity[]> {
    const areas = await this.prisma.area.findMany({
      where: { cragId: cragId.toString(), parentAreaId: null },
      orderBy: { name: 'asc' },
    })
    return areas.map((area: AreaPrismaData) => this.toEntity(area))
  }

  async findChildAreas(parentAreaId: AreaId): Promise<AreaEntity[]> {
    const areas = await this.prisma.area.findMany({
      where: { parentAreaId: parentAreaId.toString() },
      orderBy: { name: 'asc' },
    })
    return areas.map((area: AreaPrismaData) => this.toEntity(area))
  }

  async save(entity: AreaEntity): Promise<AreaEntity> {
    const data = this.toPrismaData(entity)

    const saved = await this.prisma.area.upsert({
      where: { id: entity.id.toString() },
      create: data,
      update: {
        ...data,
        updatedAt: new Date(),
      },
    })

    return this.toEntity(saved)
  }

  async saveByExternalId(entity: AreaEntity): Promise<AreaEntity> {
    const data = this.toPrismaData(entity)

    const saved = await this.prisma.area.upsert({
      where: { externalId: entity.externalId.toBigInt() },
      create: data,
      update: {
        ...data,
        updatedAt: new Date(),
      },
    })

    return this.toEntity(saved)
  }

  async delete(id: AreaId): Promise<void> {
    await this.prisma.area.delete({ where: { id: id.toString() } })
  }

  async deleteByCragId(cragId: CragId): Promise<number> {
    const result = await this.prisma.area.deleteMany({
      where: { cragId: cragId.toString() },
    })
    return result.count
  }

  async existsByExternalId(externalId: ExternalId): Promise<boolean> {
    const count = await this.prisma.area.count({
      where: { externalId: externalId.toBigInt() },
    })
    return count > 0
  }

  private toEntity(data: AreaPrismaData): AreaEntity {
    return new AreaEntity(
      AreaId.fromString(data.id),
      ExternalId.create(data.externalId),
      CragId.fromString(data.cragId),
      data.parentAreaId ? AreaId.fromString(data.parentAreaId) : null,
      Name.create(data.name),
      data.type as AreaType,
      Geometry.fromJSON(data.geometry as Record<string, unknown>),
      BetaInfo.fromJSON(data.beta as BetaItemData[]),
      data.createdAt,
      data.updatedAt,
    )
  }

  private toPrismaData(entity: AreaEntity) {
    return {
      id: entity.id.toString(),
      externalId: entity.externalId.toBigInt(),
      cragId: entity.cragId.toString(),
      parentAreaId: entity.parentAreaId?.toString() ?? null,
      name: entity.name.toString(),
      type: entity.type,
      latitude: entity.latitude,
      longitude: entity.longitude,
      geometry: entity.geometry?.toJSON() ?? null,
      beta: entity.beta.toJSON(),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }
  }
}
