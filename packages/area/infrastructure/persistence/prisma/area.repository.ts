import { Inject, Injectable } from '@OneJs/core'
import { PrismaClientOneJs, PrismaRepository } from '@OneJs/prisma'
import {
  AltNames,
  BetaInfo,
  ExternalId,
  Geometry,
  Name,
  Seasonality,
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
  altNames: string[]
  type: string
  latitude: number | null
  longitude: number | null
  geometry: unknown
  beta: unknown
  seasonality: number[]
  locatedness: number | null
  averageHeight: number | null
  numberRoutes: number | null
  permitNode: unknown
  priceCategory: string | null
  urlAncestorStub: string | null
  redirectStubs: string[]
  tlc: unknown
  apiResponseRaw: unknown
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

  async saveByExternalId(
    entity: AreaEntity,
    apiResponseRaw?: Record<string, unknown>,
  ): Promise<AreaEntity> {
    const data = this.toPrismaData(entity)
    
    // Agregar apiResponseRaw si está disponible
    if (apiResponseRaw) {
      (data as any).apiResponseRaw = apiResponseRaw
      
      // Extraer campos adicionales desde apiResponseRaw
      const raw = apiResponseRaw as any
      
      // locatedness
      if (raw.locatedness !== undefined) {
        (data as any).locatedness = raw.locatedness
      }
      
      // averageHeight viene como [valor, "m"]
      if (raw.averageHeight && Array.isArray(raw.averageHeight)) {
        const height = Number(raw.averageHeight[0])
        if (!isNaN(height)) {
          (data as any).averageHeight = height
        }
      }
      
      // Otros campos simples
      if (raw.numberRoutes !== undefined) {
        (data as any).numberRoutes = raw.numberRoutes
      }
      if (raw.permitNode) {
        (data as any).permitNode = raw.permitNode
      }
      if (raw.priceCategory) {
        (data as any).priceCategory = raw.priceCategory
      }
      if (raw.urlAncestorStub) {
        (data as any).urlAncestorStub = raw.urlAncestorStub
      }
      if (Array.isArray(raw.redirectStubs)) {
        (data as any).redirectStubs = raw.redirectStubs
      }
      if (raw.tlc) {
        (data as any).tlc = raw.tlc
      }
    }

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
      AltNames.create(data.altNames),
      data.type as AreaType,
      Geometry.fromJSON(data.geometry as Record<string, unknown>),
      BetaInfo.fromJSON(data.beta as BetaItemData[]),
      Seasonality.create(data.seasonality),
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
      altNames: entity.altNames.toArray(),
      type: entity.type,
      latitude: entity.latitude,
      longitude: entity.longitude,
      geometry: entity.geometry?.toJSON() ?? null,
      beta: entity.beta.toJSON(),
      seasonality: entity.seasonality.toArray(),
      apiResponseRaw: null, // Placeholder
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }
  }
}
