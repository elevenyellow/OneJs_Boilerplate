import { Inject, Injectable } from '@OneJs/core'
import { PrismaClientOneJs, PrismaRepository } from '@OneJs/prisma'
import { ContinentId } from '@climb-zone/continent'
import { ExternalId, Geometry } from '@climb-zone/shared'
import {
  CountryEntity,
  CountryId,
} from '@country/domain/entities/country.entity'

interface CountryPrismaData {
  id: string
  externalId: bigint
  continentId: string
  name: string
  geometry: unknown
  createdAt: Date
  updatedAt: Date
}

@Injectable()
export class CountryPrismaRepository extends PrismaRepository<'country'> {
  constructor(
    @Inject(PrismaClientOneJs) protected readonly prisma: PrismaClientOneJs,
  ) {
    super(prisma, 'country')
  }

  async findById(id: CountryId): Promise<CountryEntity | null> {
    const data = await this.prisma.country.findUnique({
      where: { id: id.toString() },
    })
    return data ? this.toEntity(data) : null
  }

  async findByExternalId(
    externalId: ExternalId,
  ): Promise<CountryEntity | null> {
    const data = await this.prisma.country.findUnique({
      where: { externalId: externalId.toBigInt() },
    })
    return data ? this.toEntity(data) : null
  }

  async findByContinent(continentId: ContinentId): Promise<CountryEntity[]> {
    const data = await this.prisma.country.findMany({
      where: { continentId: continentId.toString() },
      orderBy: { name: 'asc' },
    })
    return data.map((d: CountryPrismaData) => this.toEntity(d))
  }

  async findAll(): Promise<CountryEntity[]> {
    const data = await this.prisma.country.findMany({
      orderBy: { name: 'asc' },
    })
    return data.map((d: CountryPrismaData) => this.toEntity(d))
  }

  async save(entity: CountryEntity): Promise<CountryEntity> {
    const data = this.toPrismaData(entity)

    const saved = await this.prisma.country.upsert({
      where: { externalId: entity.externalId.toBigInt() },
      create: data,
      update: {
        name: data.name,
        geometry: data.geometry,
        continentId: data.continentId,
        updatedAt: new Date(),
      },
    })

    return this.toEntity(saved)
  }

  async saveMany(entities: CountryEntity[]): Promise<number> {
    let count = 0
    for (const entity of entities) {
      await this.save(entity)
      count++
    }
    return count
  }

  async existsByExternalId(externalId: ExternalId): Promise<boolean> {
    const count = await this.prisma.country.count({
      where: { externalId: externalId.toBigInt() },
    })
    return count > 0
  }

  private toEntity(data: CountryPrismaData): CountryEntity {
    return new CountryEntity(
      CountryId.fromString(data.id),
      ExternalId.create(data.externalId),
      ContinentId.fromString(data.continentId),
      data.name,
      Geometry.fromJSON(data.geometry as Record<string, unknown>),
    )
  }

  private toPrismaData(entity: CountryEntity) {
    return {
      id: entity.id.toString(),
      externalId: entity.externalId.toBigInt(),
      continentId: entity.continentId.toString(),
      name: entity.name,
      geometry: entity.geometry?.toJSON() ?? null,
    }
  }
}
