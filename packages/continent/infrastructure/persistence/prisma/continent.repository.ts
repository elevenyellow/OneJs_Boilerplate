import { Inject, Injectable } from '@OneJs/core'
import { PrismaClientOneJs, PrismaRepository } from '@OneJs/prisma'
import { ExternalId, Geometry } from '@climb-zone/shared'
import {
  ContinentEntity,
  ContinentId,
} from '@continent/domain/entities/continent.entity'

interface ContinentPrismaData {
  id: string
  externalId: bigint
  name: string
  geometry: unknown
  createdAt: Date
  updatedAt: Date
}

@Injectable()
export class ContinentPrismaRepository extends PrismaRepository<'continent'> {
  constructor(
    @Inject(PrismaClientOneJs) protected readonly prisma: PrismaClientOneJs,
  ) {
    super(prisma, 'continent')
  }

  async findById(id: ContinentId): Promise<ContinentEntity | null> {
    const data = await this.prisma.continent.findUnique({
      where: { id: id.toString() },
    })
    return data ? this.toEntity(data) : null
  }

  async findByExternalId(
    externalId: ExternalId,
  ): Promise<ContinentEntity | null> {
    const data = await this.prisma.continent.findUnique({
      where: { externalId: externalId.toBigInt() },
    })
    return data ? this.toEntity(data) : null
  }

  async findAll(): Promise<ContinentEntity[]> {
    const data = await this.prisma.continent.findMany({
      orderBy: { name: 'asc' },
    })
    return data.map((d: ContinentPrismaData) => this.toEntity(d))
  }

  async save(entity: ContinentEntity): Promise<ContinentEntity> {
    const data = this.toPrismaData(entity)

    const saved = await this.prisma.continent.upsert({
      where: { externalId: entity.externalId.toBigInt() },
      create: data,
      update: {
        name: data.name,
        geometry: data.geometry,
        updatedAt: new Date(),
      },
    })

    return this.toEntity(saved)
  }

  async saveMany(entities: ContinentEntity[]): Promise<number> {
    let count = 0
    for (const entity of entities) {
      await this.save(entity)
      count++
    }
    return count
  }

  async existsByExternalId(externalId: ExternalId): Promise<boolean> {
    const count = await this.prisma.continent.count({
      where: { externalId: externalId.toBigInt() },
    })
    return count > 0
  }

  private toEntity(data: ContinentPrismaData): ContinentEntity {
    return new ContinentEntity(
      ContinentId.fromString(data.id),
      ExternalId.create(data.externalId),
      data.name,
      Geometry.fromJSON(data.geometry as Record<string, unknown>),
    )
  }

  private toPrismaData(entity: ContinentEntity) {
    return {
      id: entity.id.toString(),
      externalId: entity.externalId.toBigInt(),
      name: entity.name,
      geometry: entity.geometry?.toJSON() ?? null,
    }
  }
}
