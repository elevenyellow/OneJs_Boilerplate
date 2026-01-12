import { Inject, Injectable } from '@OneJs/core'
import { PrismaClientOneJs, PrismaRepository } from '@OneJs/prisma'
import { ZoneEntity, type ClimbingType, type GradeRange, type ZoneStats } from '@zone/domain/entities/zone.entity'
import { ZoneId } from '@zone/domain/value-objects/id'
import { Coordinates } from '@zone/domain/value-objects/coordinates'
import type { ZoneFilterDto } from '@zone/domain/dtos/zone-filter.dto'

@Injectable()
export class ZonePrismaRepository extends PrismaRepository<'zone'> {
  constructor(
    @Inject(PrismaClientOneJs) protected readonly prisma: PrismaClientOneJs,
  ) {
    super(prisma, 'zone')
  }

  async findById(id: ZoneId): Promise<ZoneEntity | null> {
    const zone = await this.prisma.zone.findUnique({
      where: { id: id.toString() },
    })

    return zone ? this.toEntity(zone) : null
  }

  async findAll(filters?: ZoneFilterDto): Promise<ZoneEntity[]> {
    const where: Record<string, unknown> = {}

    if (filters?.country) {
      where.country = filters.country
    }

    if (filters?.region) {
      where.region = { contains: filters.region, mode: 'insensitive' }
    }

    if (filters?.climbingTypes && filters.climbingTypes.length > 0) {
      where.climbingTypes = { hasSome: filters.climbingTypes }
    }

    if (filters?.minRoutes) {
      where.totalRoutes = { gte: filters.minRoutes }
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { region: { contains: filters.search, mode: 'insensitive' } },
        { country: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const zones = await this.prisma.zone.findMany({
      where,
      take: filters?.limit ?? 100,
      skip: filters?.offset ?? 0,
      orderBy: { name: 'asc' },
    })

    return zones.map((zone: ZonePrismaData) => this.toEntity(zone))
  }

  async search(query: string, filters?: ZoneFilterDto): Promise<ZoneEntity[]> {
    const where: Record<string, unknown> = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { region: { contains: query, mode: 'insensitive' } },
        { country: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    }

    if (filters?.country) {
      where.country = filters.country
    }

    if (filters?.climbingTypes && filters.climbingTypes.length > 0) {
      where.climbingTypes = { hasSome: filters.climbingTypes }
    }

    const zones = await this.prisma.zone.findMany({
      where,
      take: filters?.limit ?? 50,
      skip: filters?.offset ?? 0,
      orderBy: { totalRoutes: 'desc' },
    })

    return zones.map((zone: ZonePrismaData) => this.toEntity(zone))
  }

  async createEntity(zone: ZoneEntity): Promise<ZoneEntity> {
    await this.prisma.zone.create({
      data: this.toPrismaCreate(zone),
    })

    return (await this.findById(zone.id))!
  }

  async updateEntity(zone: ZoneEntity): Promise<void> {
    await this.prisma.zone.update({
      where: { id: zone.id.toString() },
      data: this.toPrismaUpdate(zone),
    })
  }

  async deleteEntity(id: ZoneId): Promise<void> {
    await this.prisma.zone.delete({ where: { id: id.toString() } })
  }

  async getCountries(): Promise<string[]> {
    const result = await this.prisma.zone.findMany({
      select: { country: true },
      distinct: ['country'],
      orderBy: { country: 'asc' },
    })
    return result.map((r: { country: string }) => r.country)
  }

  async getRegions(country?: string): Promise<string[]> {
    const where = country ? { country } : {}
    const result = await this.prisma.zone.findMany({
      where,
      select: { region: true },
      distinct: ['region'],
      orderBy: { region: 'asc' },
    })
    return result.map((r: { region: string }) => r.region)
  }

  private toEntity(zone: ZonePrismaData): ZoneEntity {
    return new ZoneEntity(
      ZoneId.createFrom(zone.id),
      zone.name,
      zone.description,
      zone.country,
      zone.region,
      new Coordinates(zone.latitude, zone.longitude),
      zone.climbingTypes as ClimbingType[],
      zone.gradeRange as GradeRange,
      zone.stats as ZoneStats,
      zone.theCragUrl,
      zone.imageUrl ?? undefined,
      zone.altitude ?? undefined,
      zone.approach ?? undefined,
      zone.bestSeasons ?? undefined,
      zone.createdAt,
      zone.updatedAt,
    )
  }

  private toPrismaCreate(zone: ZoneEntity) {
    return {
      id: zone.id.toString(),
      name: zone.name,
      description: zone.description,
      country: zone.country,
      region: zone.region,
      latitude: zone.coordinates.latitude,
      longitude: zone.coordinates.longitude,
      climbingTypes: zone.climbingTypes,
      gradeRange: zone.gradeRange,
      stats: zone.stats,
      totalRoutes: zone.stats.totalRoutes,
      theCragUrl: zone.theCragUrl,
      imageUrl: zone.imageUrl,
      altitude: zone.altitude,
      approach: zone.approach,
      bestSeasons: zone.bestSeasons,
      createdAt: zone.createdAt,
      updatedAt: zone.updatedAt,
    }
  }

  private toPrismaUpdate(zone: ZoneEntity) {
    return {
      name: zone.name,
      description: zone.description,
      country: zone.country,
      region: zone.region,
      latitude: zone.coordinates.latitude,
      longitude: zone.coordinates.longitude,
      climbingTypes: zone.climbingTypes,
      gradeRange: zone.gradeRange,
      stats: zone.stats,
      totalRoutes: zone.stats.totalRoutes,
      theCragUrl: zone.theCragUrl,
      imageUrl: zone.imageUrl,
      altitude: zone.altitude,
      approach: zone.approach,
      bestSeasons: zone.bestSeasons,
      updatedAt: new Date(),
    }
  }
}

// Type for Prisma data
interface ZonePrismaData {
  id: string
  name: string
  description: string
  country: string
  region: string
  latitude: number
  longitude: number
  climbingTypes: string[]
  gradeRange: unknown
  stats: unknown
  totalRoutes: number
  theCragUrl: string
  imageUrl: string | null
  altitude: number | null
  approach: string | null
  bestSeasons: string[] | null
  createdAt: Date
  updatedAt: Date
}


