import { Inject, Injectable } from '@OneJs/core'
import { PrismaClientOneJs, PrismaRepository } from '@OneJs/prisma'
import {
  ClimbingZoneEntity,
  type ClimbType,
} from '@scraper-thecrag/domain/entities/climbing-zone.entity'

@Injectable()
export class ZonePrismaRepository extends PrismaRepository<'climbingZone'> {
  constructor(
    @Inject(PrismaClientOneJs) protected readonly prisma: PrismaClientOneJs,
  ) {
    super(prisma, 'climbingZone')
  }

  async findById(id: string): Promise<ClimbingZoneEntity | null> {
    const zone = await this.prisma.climbingZone.findUnique({
      where: { id },
    })

    return zone ? this.toEntity(zone) : null
  }

  async findByExternalId(
    externalId: string,
  ): Promise<ClimbingZoneEntity | null> {
    const zone = await this.prisma.climbingZone.findUnique({
      where: { externalId },
    })

    return zone ? this.toEntity(zone) : null
  }

  async findByCountry(country: string): Promise<ClimbingZoneEntity[]> {
    const zones = await this.prisma.climbingZone.findMany({
      where: { country },
      orderBy: { name: 'asc' },
    })

    return zones.map((zone) => this.toEntity(zone))
  }

  async findNearby(
    latitude: number,
    longitude: number,
    radiusKm: number = 50,
  ): Promise<ClimbingZoneEntity[]> {
    // Cálculo aproximado de grados para el radio
    const latDelta = radiusKm / 111 // ~111km por grado de latitud
    const lonDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180))

    const zones = await this.prisma.climbingZone.findMany({
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
    })

    return zones.map((zone) => this.toEntity(zone))
  }

  async createEntity(zone: ClimbingZoneEntity): Promise<ClimbingZoneEntity> {
    const created = await this.prisma.climbingZone.create({
      data: this.toPrismaCreate(zone),
    })

    return this.toEntity(created)
  }

  async updateEntity(zone: ClimbingZoneEntity): Promise<ClimbingZoneEntity> {
    const updated = await this.prisma.climbingZone.update({
      where: { id: zone.id },
      data: this.toPrismaUpdate(zone),
    })

    return this.toEntity(updated)
  }

  async upsertByExternalId(
    zone: ClimbingZoneEntity,
  ): Promise<ClimbingZoneEntity> {
    const upserted = await this.prisma.climbingZone.upsert({
      where: { externalId: zone.externalId },
      create: this.toPrismaCreate(zone),
      update: this.toPrismaUpdate(zone),
    })

    return this.toEntity(upserted)
  }

  async deleteEntity(id: string): Promise<void> {
    await this.prisma.climbingZone.delete({ where: { id } })
  }

  async countByCountry(): Promise<Record<string, number>> {
    const result = await this.prisma.climbingZone.groupBy({
      by: ['country'],
      _count: { id: true },
    })

    return result.reduce(
      (acc, item) => {
        acc[item.country] = item._count.id
        return acc
      },
      {} as Record<string, number>,
    )
  }

  async getAllExternalIds(): Promise<string[]> {
    const zones = await this.prisma.climbingZone.findMany({
      select: { externalId: true },
    })

    return zones.map((z) => z.externalId)
  }

  private toEntity(zone: {
    id: string
    externalId: string
    name: string
    country: string
    region: string | null
    latitude: number
    longitude: number
    routeCount: number
    climbTypes: string[]
    minGrade: string | null
    maxGrade: string | null
    description: string | null
    accessInfo: string | null
    imageUrl: string | null
    sourceUrl: string
    createdAt: Date
    updatedAt: Date
  }): ClimbingZoneEntity {
    return new ClimbingZoneEntity(
      zone.id,
      zone.externalId,
      zone.name,
      zone.country,
      zone.region,
      zone.latitude,
      zone.longitude,
      zone.routeCount,
      zone.climbTypes as ClimbType[],
      zone.minGrade,
      zone.maxGrade,
      zone.description,
      zone.accessInfo,
      zone.imageUrl,
      zone.sourceUrl,
      zone.createdAt,
      zone.updatedAt,
    )
  }

  private toPrismaCreate(zone: ClimbingZoneEntity) {
    return {
      id: zone.id,
      externalId: zone.externalId,
      name: zone.name,
      country: zone.country,
      region: zone.region,
      latitude: zone.latitude,
      longitude: zone.longitude,
      routeCount: zone.routeCount,
      climbTypes: zone.climbTypes,
      minGrade: zone.minGrade,
      maxGrade: zone.maxGrade,
      description: zone.description,
      accessInfo: zone.accessInfo,
      imageUrl: zone.imageUrl,
      sourceUrl: zone.sourceUrl,
    }
  }

  private toPrismaUpdate(zone: ClimbingZoneEntity) {
    return {
      name: zone.name,
      country: zone.country,
      region: zone.region,
      latitude: zone.latitude,
      longitude: zone.longitude,
      routeCount: zone.routeCount,
      climbTypes: zone.climbTypes,
      minGrade: zone.minGrade,
      maxGrade: zone.maxGrade,
      description: zone.description,
      accessInfo: zone.accessInfo,
      imageUrl: zone.imageUrl,
      sourceUrl: zone.sourceUrl,
      updatedAt: new Date(),
    }
  }
}
