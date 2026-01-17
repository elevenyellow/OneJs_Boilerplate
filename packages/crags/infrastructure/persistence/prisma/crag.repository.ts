import { Inject, Injectable } from '@OneJs/core'
import { PrismaClientOneJs, PrismaRepository } from '@OneJs/prisma'
import type { Prisma } from '@prisma/client'
import type { CragCreateDto } from '../../../domain/dtos'
import { Crag } from '../../../domain/entities/crag.entity'
import {
  Coordinates,
  ExternalId,
  Id,
  type GeometryData,
  type BetaItem,
  type StyleInfo,
  type TagsMap,
  type AltName,
} from '../../../domain/value-objects'
import type { ZoneId } from '@zones/domain/value-objects'
import type {
  CragStatisticsFields,
  RouteDataForCragStats,
  SectorSummary,
} from '@crags/application/mappers/crag-stats.mapper'

@Injectable()
export class CragPrismaRepository extends PrismaRepository<'crag'> {
  constructor(@Inject(PrismaClientOneJs) prisma: PrismaClientOneJs) {
    super(prisma, 'crag')
  }

  async findByExternalId(externalId: ExternalId): Promise<Crag | null> {
    const data = await this.findOne({
      where: { externalId: externalId.getValue() },
    })

    if (!data) return null

    return this.mapToDomain(data)
  }

  async findById(id: Id): Promise<Crag | null> {
    const data = await this.findOne({
      where: { id: id.getValue() },
    })

    if (!data) return null

    return this.mapToDomain(data)
  }

  async findByZoneId(zoneId: ZoneId): Promise<Crag | null> {
    const data = await this.findOne({
      where: { id: zoneId.toString() },
    })

    if (!data) return null

    return this.mapToDomain(data)
  }

  async save(crag: Crag): Promise<Crag> {
    const primitives = crag.toPrimitives()

    const data = await this.model.upsert({
      where: { externalId: primitives.externalId.toString() },
      create: this.mapToPrisma(primitives),
      update: this.mapToPrisma(primitives),
    })

    return this.mapToDomain(data)
  }

  async existsByExternalId(externalId: ExternalId): Promise<boolean> {
    const count = await this.model.count({
      where: { externalId: externalId.getValue() },
    })
    return count > 0
  }

  async findAllWithSectors(): Promise<Crag[]> {
    const data = await this.findAll({
      where: { hasSectors: true },
    })

    return data.map((item: Prisma.CragGetPayload<object>) =>
      this.mapToDomain(item),
    )
  }

  async findByCoordinates(
    coordinates: Coordinates,
    radiusKm: number = 50,
  ): Promise<Crag[]> {
    const lat = coordinates.getLatitude()
    const lng = coordinates.getLongitude()

    if (lat === null || lng === null) {
      return []
    }

    // Aproximación simple usando bounding box
    const latDelta = radiusKm / 111 // 1 grado ≈ 111 km
    const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180))

    const data = await this.findAll({
      where: {
        latitude: {
          gte: lat - latDelta,
          lte: lat + latDelta,
        },
        longitude: {
          gte: lng - lngDelta,
          lte: lng + lngDelta,
        },
      },
    })

    return data.map((item: Prisma.CragGetPayload<object>) =>
      this.mapToDomain(item),
    )
  }

  /**
   * Get all routes for a crag with fields needed for stats calculation
   */
  async getRoutesForStats(cragId: Id): Promise<RouteDataForCragStats[]> {
    const routes = await this.prisma.route.findMany({
      where: { cragId: cragId.getValue() },
      select: {
        gradeBand: true,
        stars: true,
        ascents: true,
        popularity: true,
        height: true,
        pitches: true,
        bolts: true,
        hasTopo: true,
        styleFlags: true,
        name: true,
        sectorId: true,
      },
    })

    return routes
  }

  /**
   * Get sector summaries for a crag (used for best sector calculation)
   */
  async getSectorSummaries(cragId: Id): Promise<SectorSummary[]> {
    const sectors = await this.prisma.sector.findMany({
      where: { cragId: cragId.getValue() },
      select: {
        id: true,
        name: true,
        overallScore: true,
      },
    })

    return sectors
  }

  /**
   * Update computed statistics for a crag
   */
  async updateStats(cragId: Id, stats: CragStatisticsFields): Promise<void> {
    await this.model.update({
      where: { id: cragId.getValue() },
      data: {
        // Grade Distribution Stats
        minGradeIndex: stats.minGradeIndex ?? 0,
        maxGradeIndex: stats.maxGradeIndex ?? 0,
        modeGradeIndex: stats.modeGradeIndex ?? 0,
        beginnerRoutesCount: stats.beginnerRoutesCount ?? 0,
        intermediateRoutesCount: stats.intermediateRoutesCount ?? 0,
        advancedRoutesCount: stats.advancedRoutesCount ?? 0,
        eliteRoutesCount: stats.eliteRoutesCount ?? 0,
        difficultySpread: stats.difficultySpread ?? 'varied',
        concentrationScore: stats.concentrationScore ?? 0,
        // Style Distribution Stats
        sportCount: stats.sportCount ?? 0,
        tradCount: stats.tradCount ?? 0,
        boulderCount: stats.boulderCount ?? 0,
        aidCount: stats.aidCount ?? 0,
        alpineCount: stats.alpineCount ?? 0,
        primaryStyle: stats.primaryStyle ?? 'sport',
        isMultiStyle: stats.isMultiStyle,
        // Quality Stats
        classicRoutesCount: stats.classicRoutesCount ?? 0,
        recommendedRoutesCount: stats.recommendedRoutesCount ?? 0,
        highQualityRoutesCount: stats.highQualityRoutesCount ?? 0,
        averageQualityScore: stats.averageQualityScore ?? 0,
        averageStars: stats.averageStars ?? 0,
        qualityRating: stats.qualityRating ?? 0,
        isHighQualitySector: stats.isHighQualitySector,
        // Popularity Stats
        totalAscents: stats.totalAscents ?? 0,
        popularRoutesCount: stats.popularRoutesCount ?? 0,
        veryPopularRoutesCount: stats.veryPopularRoutesCount ?? 0,
        averageAscentsPerRoute: stats.averageAscentsPerRoute ?? 0,
        popularityScore: stats.popularityScore ?? 0,
        isPopularCrag: stats.isPopularCrag,
        // Height Stats
        maxHeight: stats.maxHeight ?? 0,
        totalClimbableMeters: stats.totalClimbableMeters ?? 0,
        multiPitchCount: stats.multiPitchCount ?? 0,
        singlePitchCount: stats.singlePitchCount ?? 0,
        averagePitches: stats.averagePitches ?? 1,
        isMultiPitchFocused: stats.isMultiPitchFocused,
        hasTallRoutes: stats.hasTallRoutes,
        // Equipment Stats
        averageBolts: stats.averageBolts ?? 0,
        maxBolts: stats.maxBolts ?? 0,
        routesWithTopoCount: stats.routesWithTopoCount ?? 0,
        isWellDocumented: stats.isWellDocumented,
        isWellEquipped: stats.isWellEquipped,
        // Audience Profile
        beginnerPercentage: stats.beginnerPercentage ?? 0,
        intermediatePercentage: stats.intermediatePercentage ?? 0,
        advancedPercentage: stats.advancedPercentage ?? 0,
        elitePercentage: stats.elitePercentage ?? 0,
        primaryAudience: stats.primaryAudience ?? 'intermediate',
        isBeginnerFriendly: stats.isBeginnerFriendly,
        isFamilyFriendly: stats.isFamilyFriendly,
        // Sector Stats
        sectorCount: stats.sectorCount ?? 0,
        bestSectorId: stats.bestSectorId,
        bestSectorName: stats.bestSectorName,
        bestSectorScore: stats.bestSectorScore ?? 0,
        // Overall Scores
        overallScore: stats.overallScore ?? 0,
        cragRating: stats.cragRating ?? 0,
      },
    })
  }

  private mapToDomain(data: Prisma.CragGetPayload<object>): Crag {
    return Crag.create({
      id: data.id,
      externalId: data.externalId,
      zoneId: data.zoneId,
      name: data.name,
      asciiName: data.asciiName,
      type: data.type,
      subType: data.subType,
      urlStub: data.urlStub,
      urlAncestorStub: data.urlAncestorStub,
      headerImage: data.headerImage,
      latitude: data.latitude,
      longitude: data.longitude,
      areaSize: data.areaSize,
      geometry: data.geometry ? (data.geometry as GeometryData) : null,
      numberRoutes: data.numberRoutes,
      numberPhotos: data.numberPhotos,
      numberTopos: data.numberTopos,
      ascentCount: data.ascentCount,
      kudos: data.kudos,
      overallScore: data.overallScore,
      qualityRating: data.qualityRating,
      popularityScore: data.popularityScore,
      averageHeight: data.averageHeight,
      averageHeightUnit: data.averageHeightUnit,
      gbRoutes: data.gbRoutes,
      beta: data.beta as unknown as BetaItem[] | null | undefined,
      styles: data.styles as unknown as StyleInfo[] | null | undefined,
      tags: data.tags as unknown as TagsMap | null | undefined,
      altNames: data.altNames as unknown as AltName[] | null | undefined,
      seasonality: data.seasonality,
      hasTopo: data.hasTopo,
      hasSectors: data.hasSectors,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    })
  }

  private mapToPrisma(dto: CragCreateDto): Prisma.CragCreateInput {
    return {
      id: dto.id,
      externalId: dto.externalId.toString(),
      zone: {
        connect: { id: dto.zoneId },
      },
      name: dto.name,
      asciiName: dto.asciiName,
      type: dto.type,
      subType: dto.subType,
      urlStub: dto.urlStub,
      urlAncestorStub: dto.urlAncestorStub,
      headerImage: dto.headerImage,
      latitude: dto.latitude,
      longitude: dto.longitude,
      areaSize: dto.areaSize,
      geometry: (dto.geometry ?? undefined) as unknown as Prisma.InputJsonValue,
      numberRoutes: dto.numberRoutes,
      numberPhotos: dto.numberPhotos,
      numberTopos: dto.numberTopos,
      ascentCount: dto.ascentCount,
      kudos: dto.kudos,
      averageHeight: dto.averageHeight,
      averageHeightUnit: dto.averageHeightUnit,
      gbRoutes: dto.gbRoutes || [],
      beta: (dto.beta ?? undefined) as unknown as Prisma.InputJsonValue,
      styles: (dto.styles ?? undefined) as unknown as Prisma.InputJsonValue,
      tags: (dto.tags ?? undefined) as unknown as Prisma.InputJsonValue,
      altNames: (dto.altNames ?? undefined) as unknown as Prisma.InputJsonValue,
      seasonality: dto.seasonality || [],
      hasTopo: dto.hasTopo,
      hasSectors: dto.hasSectors,
    }
  }
}
