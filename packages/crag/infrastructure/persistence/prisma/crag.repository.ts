import { Inject, Injectable } from '@OneJs/core'
import { PrismaClientOneJs, PrismaRepository } from '@OneJs/prisma'
import { CountryId } from '@climb-zone/country'
import { RegionId } from '@climb-zone/region'
import {
  BetaInfo,
  ExternalId,
  Geometry,
  Name,
  Seasonality,
  Url,
} from '@climb-zone/shared'
import { CragEntity } from '@crag/domain/entities/crag.entity'
import { CragId } from '@crag/domain/value-objects/crag-id.vo'

interface CragPrismaData {
  id: string
  externalId: bigint
  countryId: string
  regionId: string | null
  name: string
  latitude: number | null
  longitude: number | null
  geometry: unknown
  seasonality: number[]
  description: string | null
  approach: string | null
  ethic: string | null
  sourceUrl: string
  createdAt: Date
  updatedAt: Date
}

@Injectable()
export class CragPrismaRepository extends PrismaRepository<'crag'> {
  constructor(
    @Inject(PrismaClientOneJs) protected readonly prisma: PrismaClientOneJs,
  ) {
    super(prisma, 'crag')
  }

  async findById(id: CragId): Promise<CragEntity | null> {
    const crag = await this.prisma.crag.findUnique({
      where: { id: id.toString() },
    })
    return crag ? this.toEntity(crag) : null
  }

  async findByExternalId(externalId: ExternalId): Promise<CragEntity | null> {
    const crag = await this.prisma.crag.findUnique({
      where: { externalId: externalId.toBigInt() },
    })
    return crag ? this.toEntity(crag) : null
  }

  async findByCountryId(countryId: CountryId): Promise<CragEntity[]> {
    const crags = await this.prisma.crag.findMany({
      where: { countryId: countryId.toString() },
      orderBy: { name: 'asc' },
    })
    return crags.map((crag: CragPrismaData) => this.toEntity(crag))
  }

  async findAll(): Promise<CragEntity[]> {
    const crags = await this.prisma.crag.findMany({
      orderBy: { name: 'asc' },
    })
    return crags.map((crag: CragPrismaData) => this.toEntity(crag))
  }

  async save(entity: CragEntity): Promise<CragEntity> {
    const data = this.toPrismaData(entity)

    const saved = await this.prisma.crag.upsert({
      where: { id: entity.id.toString() },
      create: data,
      update: {
        ...data,
        updatedAt: new Date(),
      },
    })

    return this.toEntity(saved)
  }

  async saveByExternalId(entity: CragEntity): Promise<CragEntity> {
    const data = this.toPrismaData(entity)

    // Verificar que countryId existe antes de intentar guardar
    const countryExists = await this.prisma.country.findUnique({
      where: { id: data.countryId },
    })

    if (!countryExists) {
      throw new Error(
        `[CragRepo] Country with id "${data.countryId}" does not exist in database. Cannot save crag "${data.name}".`,
      )
    }

    const saved = await this.prisma.crag.upsert({
      where: { externalId: entity.externalId.toBigInt() },
      create: data,
      update: {
        ...data,
        updatedAt: new Date(),
      },
    })

    return this.toEntity(saved)
  }

  async delete(id: CragId): Promise<void> {
    await this.prisma.crag.delete({ where: { id: id.toString() } })
  }

  async existsByExternalId(externalId: ExternalId): Promise<boolean> {
    const count = await this.prisma.crag.count({
      where: { externalId: externalId.toBigInt() },
    })
    return count > 0
  }

  private toEntity(data: CragPrismaData): CragEntity {
    // Reconstruct BetaInfo from stored description/approach/ethic
    const betaItems = []
    if (data.description) {
      betaItems.push({ name: 'Description', markdown: data.description })
    }
    if (data.approach) {
      betaItems.push({ name: 'Approach', markdown: data.approach })
    }
    if (data.ethic) {
      betaItems.push({ name: 'Ethics', markdown: data.ethic })
    }

    return new CragEntity(
      CragId.fromString(data.id),
      ExternalId.create(data.externalId),
      CountryId.fromString(data.countryId),
      data.regionId ? RegionId.fromString(data.regionId) : null,
      Name.create(data.name),
      Geometry.fromJSON(data.geometry as Record<string, unknown>),
      Seasonality.create(data.seasonality),
      BetaInfo.fromJSON(betaItems),
      Url.create(data.sourceUrl),
      data.createdAt,
      data.updatedAt,
    )
  }

  private toPrismaData(entity: CragEntity) {
    return {
      id: entity.id.toString(),
      externalId: entity.externalId.toBigInt(),
      countryId: entity.countryId.toString(),
      regionId: entity.regionId?.toString() ?? null,
      name: entity.name.toString(),
      latitude: entity.latitude,
      longitude: entity.longitude,
      geometry: entity.geometry?.toJSON() ?? null,
      seasonality: entity.seasonality.toArray(),
      description: entity.description,
      approach: entity.approach,
      ethic: entity.ethic,
      sourceUrl: entity.sourceUrl.toString(),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }
  }
}
