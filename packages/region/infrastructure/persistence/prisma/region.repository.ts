import { CountryId } from '@climb-zone/country'
import { ExternalId, Geometry } from '@climb-zone/shared'
import { Inject, Injectable, PrismaClientOneJs } from '@OneJs/core'
import { RegionEntity } from '@region/domain/entities/region.entity'
import { RegionId } from '@region/domain/value-objects/region-id.vo'
import { Name } from '@climb-zone/shared'

@Injectable()
export class RegionPrismaRepository {
  constructor(
    @Inject(PrismaClientOneJs)
    private readonly prisma: PrismaClientOneJs,
  ) {}

  async save(entity: RegionEntity): Promise<RegionEntity> {
    const data = {
      id: entity.id.toString(),
      externalId: entity.externalId.toBigInt(),
      countryId: entity.countryId.toString(),
      name: entity.name.toString(),
      latitude: entity.latitude,
      longitude: entity.longitude,
      geometry: entity.geometry?.toJSON(),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }

    const saved = await this.prisma.region.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    })

    return this.toDomain(saved)
  }

  async saveByExternalId(entity: RegionEntity): Promise<RegionEntity> {
    const data = {
      id: entity.id.toString(),
      externalId: entity.externalId.toBigInt(),
      countryId: entity.countryId.toString(),
      name: entity.name.toString(),
      latitude: entity.latitude,
      longitude: entity.longitude,
      geometry: entity.geometry?.toJSON(),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }

    const saved = await this.prisma.region.upsert({
      where: { externalId: data.externalId },
      create: data,
      update: {
        name: data.name,
        latitude: data.latitude,
        longitude: data.longitude,
        geometry: data.geometry,
        updatedAt: data.updatedAt,
      },
    })

    return this.toDomain(saved)
  }

  async findById(id: RegionId): Promise<RegionEntity | null> {
    const region = await this.prisma.region.findUnique({
      where: { id: id.toString() },
    })

    return region ? this.toDomain(region) : null
  }

  async findByExternalId(
    externalId: ExternalId,
  ): Promise<RegionEntity | null> {
    const region = await this.prisma.region.findUnique({
      where: { externalId: externalId.toBigInt() },
    })

    return region ? this.toDomain(region) : null
  }

  async findByCountry(countryId: CountryId): Promise<RegionEntity[]> {
    const regions = await this.prisma.region.findMany({
      where: { countryId: countryId.toString() },
      orderBy: { name: 'asc' },
    })

    return regions.map((r) => this.toDomain(r))
  }

  async findAll(): Promise<RegionEntity[]> {
    const regions = await this.prisma.region.findMany({
      orderBy: { name: 'asc' },
    })

    return regions.map((r) => this.toDomain(r))
  }

  private toDomain(data: {
    id: string
    externalId: bigint
    countryId: string
    name: string
    latitude: number | null
    longitude: number | null
    geometry: unknown
    createdAt: Date
    updatedAt: Date
  }): RegionEntity {
    return new RegionEntity(
      RegionId.fromString(data.id),
      ExternalId.create(Number(data.externalId)),
      CountryId.fromString(data.countryId),
      Name.create(data.name),
      data.geometry ? Geometry.fromJSON(data.geometry) : null,
      data.createdAt,
      data.updatedAt,
    )
  }
}
