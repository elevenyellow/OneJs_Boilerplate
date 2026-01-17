import { Inject, Injectable } from '@OneJs/core'
import { PrismaClientOneJs, PrismaRepository } from '@OneJs/prisma'
import type {
  AltNameData,
  BetaItemData,
  SectorCreateDto,
  StyleInfoData,
} from '../../../domain/dtos'
import { Sector } from '../../../domain/entities/sector.entity'
import {
  type AspectDirection,
  type ClimbingStyle,
  type CrowdLevel,
  ExternalId,
  type FamilyFriendly,
  type GeometryData,
  type TagsData,
  type WalkInTime,
  type WeatherCondition,
  Id,
} from '../../../domain/value-objects'
import { Id as CragId } from '@crags/domain/value-objects'
import type { SectorStatisticsFields } from '../../../application/mappers/sector-stats.mapper'

/**
 * Route data needed for sector statistics calculation
 */
export interface RouteDataForSectorStats {
  gradeBand: number | null
  stars: number | null
  ascents: number | null
  popularity: number | null
  height: number | null
  pitches: number | null
  bolts: number | null
  hasTopo: boolean
  styleFlags: number
  name: string | null
}

@Injectable()
export class SectorPrismaRepository extends PrismaRepository<'sector'> {
  constructor(@Inject(PrismaClientOneJs) prisma: PrismaClientOneJs) {
    super(prisma, 'sector')
  }

  async findByExternalId(externalId: ExternalId): Promise<Sector | null> {
    const data = await this.findOne({
      where: { externalId: externalId.getValue() },
    })

    if (!data) return null

    return this.mapToDomain(data)
  }

  async findById(id: Id): Promise<Sector | null> {
    const data = await this.findOne({
      where: { id: id.getValue() },
    })

    if (!data) return null

    return this.mapToDomain(data)
  }

  async findByCragId(cragId: CragId): Promise<Sector[]> {
    const data = await this.findAll({
      where: { cragId: cragId.getValue() },
      orderBy: { depth: 'asc' },
    })

    return data.map((item) => this.mapToDomain(item))
  }

  async findTopLevelByCragId(cragId: CragId): Promise<Sector[]> {
    const data = await this.findAll({
      where: {
        cragId: cragId.getValue(),
        parentId: null,
      },
      orderBy: { name: 'asc' },
    })

    return data.map((item) => this.mapToDomain(item))
  }

  async findChildren(parentId: Id): Promise<Sector[]> {
    const data = await this.findAll({
      where: { parentId: parentId.getValue() },
    })

    return data.map((item) => this.mapToDomain(item))
  }

  async save(sector: Sector): Promise<Sector> {
    const primitives = sector.toPrimitives()

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

  /**
   * Get all routes for a sector with fields needed for stats calculation
   */
  async getRoutesForStats(sectorId: Id): Promise<RouteDataForSectorStats[]> {
    const routes = await this.prisma.route.findMany({
      where: { sectorId: sectorId.getValue() },
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
      },
    })

    return routes
  }

  /**
   * Update computed statistics for a sector
   */
  async updateStats(
    sectorId: Id,
    stats: SectorStatisticsFields,
  ): Promise<void> {
    await this.model.update({
      where: { id: sectorId.getValue() },
      data: {
        minGradeIndex: stats.minGradeIndex,
        maxGradeIndex: stats.maxGradeIndex,
        modeGradeIndex: stats.modeGradeIndex,
        beginnerRoutesCount: stats.beginnerRoutesCount,
        intermediateRoutesCount: stats.intermediateRoutesCount,
        advancedRoutesCount: stats.advancedRoutesCount,
        eliteRoutesCount: stats.eliteRoutesCount,
        difficultySpread: stats.difficultySpread,
        concentrationScore: stats.concentrationScore,
        sportCount: stats.sportCount,
        tradCount: stats.tradCount,
        boulderCount: stats.boulderCount,
        aidCount: stats.aidCount,
        alpineCount: stats.alpineCount,
        primaryStyle: stats.primaryStyle,
        isMultiStyle: stats.isMultiStyle,
        classicRoutesCount: stats.classicRoutesCount,
        recommendedRoutesCount: stats.recommendedRoutesCount,
        highQualityRoutesCount: stats.highQualityRoutesCount,
        averageQualityScore: stats.averageQualityScore,
        averageStars: stats.averageStars,
        qualityRating: stats.qualityRating,
        isHighQualitySector: stats.isHighQualitySector,
        totalAscents: stats.totalAscents,
        popularRoutesCount: stats.popularRoutesCount,
        veryPopularRoutesCount: stats.veryPopularRoutesCount,
        averageAscentsPerRoute: stats.averageAscentsPerRoute,
        popularityScore: stats.popularityScore,
        isPopularSector: stats.isPopularSector,
        maxHeight: stats.maxHeight,
        totalClimbableMeters: stats.totalClimbableMeters,
        multiPitchCount: stats.multiPitchCount,
        singlePitchCount: stats.singlePitchCount,
        averagePitches: stats.averagePitches,
        isMultiPitchFocused: stats.isMultiPitchFocused,
        hasTallRoutes: stats.hasTallRoutes,
        averageBolts: stats.averageBolts,
        maxBolts: stats.maxBolts,
        routesWithTopoCount: stats.routesWithTopoCount,
        isWellDocumented: stats.isWellDocumented,
        isWellEquipped: stats.isWellEquipped,
        beginnerPercentage: stats.beginnerPercentage,
        intermediatePercentage: stats.intermediatePercentage,
        advancedPercentage: stats.advancedPercentage,
        elitePercentage: stats.elitePercentage,
        primaryAudience: stats.primaryAudience,
        isBeginnerFriendly: stats.isBeginnerFriendly,
        isFamilyFriendly: stats.isFamilyFriendly,
        overallScore: stats.overallScore,
        sectorRating: stats.sectorRating,
      },
    })
  }

  private mapToDomain(data: Record<string, unknown>): Sector {
    return Sector.create({
      id: data.id as string,
      externalId: data.externalId as string,
      name: data.name as string,
      asciiName: data.asciiName as string | null,
      type: data.type as string,
      subType: data.subType as string,
      urlStub: data.urlStub as string | null,
      urlAncestorStub: data.urlAncestorStub as string | null,
      headerImage: data.headerImage as string | null,
      coverImage: data.coverImage as string | null,
      thumbnail: data.thumbnail as string | null,
      approach: data.approach as string | null,
      latitude: data.latitude as number | null,
      longitude: data.longitude as number | null,
      geometry: data.geometry as GeometryData | null,
      depth: data.depth as number,
      parentId: data.parentId as string | null,
      cragId: data.cragId as string,
      externalParentId: data.externalParentId as string | null,
      numberRoutes: data.numberRoutes as number | null,
      numberPhotos: data.numberPhotos as number | null,
      numberTopos: data.numberTopos as number | null,
      ascentCount: data.ascentCount as number | null,
      kudos: data.kudos as number | null,
      maxPop: data.maxPop as number | null,
      subAreaCount: data.subAreaCount as number | null,
      averageHeight: data.averageHeight as number | null,
      averageHeightUnit: data.averageHeightUnit as string | null,
      seasonality: data.seasonality as number[] | null,
      tags: data.tags as TagsData | null,
      tagAspect: data.tagAspect as AspectDirection | null,
      tagWalkInTime: data.tagWalkInTime as WalkInTime | null,
      tagFamily: data.tagFamily as FamilyFriendly | null,
      tagWeather: (data.tagWeather as WeatherCondition[]) || [],
      tagCrowds: data.tagCrowds as CrowdLevel | null,
      tagStyle: data.tagStyle as ClimbingStyle | null,
      beta: data.beta as BetaItemData[] | null,
      styles: data.styles as StyleInfoData[] | null,
      altNames: data.altNames as AltNameData[] | null,
      gbRoutes: data.gbRoutes as number[] | null,
      hasTopo: data.hasTopo as boolean,
      hasSubSectors: data.hasSubSectors as boolean,
      createdAt: data.createdAt as Date,
      updatedAt: data.updatedAt as Date,
    })
  }

  private mapToPrisma(dto: SectorCreateDto): Record<string, unknown> {
    return {
      id: dto.id,
      externalId: dto.externalId.toString(),
      name: dto.name,
      asciiName: dto.asciiName,
      type: dto.type,
      subType: dto.subType,
      urlStub: dto.urlStub,
      urlAncestorStub: dto.urlAncestorStub,
      headerImage: dto.headerImage,
      coverImage: dto.coverImage,
      thumbnail: dto.thumbnail,
      approach: dto.approach,
      latitude: dto.latitude,
      longitude: dto.longitude,
      geometry: dto.geometry,
      depth: dto.depth,
      parentId: dto.parentId,
      cragId: dto.cragId,
      externalParentId: dto.externalParentId,
      numberRoutes: dto.numberRoutes,
      numberPhotos: dto.numberPhotos,
      numberTopos: dto.numberTopos,
      ascentCount: dto.ascentCount,
      kudos: dto.kudos,
      maxPop: dto.maxPop,
      subAreaCount: dto.subAreaCount,
      averageHeight: dto.averageHeight,
      averageHeightUnit: dto.averageHeightUnit,
      seasonality: dto.seasonality || [],
      tags: dto.tags,
      tagAspect: dto.tagAspect || null,
      tagWalkInTime: dto.tagWalkInTime || null,
      tagFamily: dto.tagFamily || null,
      tagWeather: dto.tagWeather || [],
      tagCrowds: dto.tagCrowds || null,
      tagStyle: dto.tagStyle || null,
      beta: dto.beta,
      styles: dto.styles,
      altNames: dto.altNames,
      gbRoutes: dto.gbRoutes || [],
      hasTopo: dto.hasTopo,
      hasSubSectors: dto.hasSubSectors,
    }
  }
}
