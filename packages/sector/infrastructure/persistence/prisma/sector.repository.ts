import { Inject, Injectable } from '@OneJs/core'
import { PrismaClientOneJs, PrismaRepository } from '@OneJs/prisma'
import { AreaId } from '@area/domain/value-objects/area-id.vo'
import {
  AltNames,
  BetaInfo,
  ExternalId,
  Geometry,
  Locatedness,
  Name,
  PermitInfo,
  Seasonality,
  type BetaItemData,
} from '@climb-zone/shared'
import type { RouteSearchInfo } from '@sector/domain/dtos/search-sectors.dto'
import {
  SectorEntity,
  type SectorType,
} from '@sector/domain/entities/sector.entity'
import { ClimbingStyle } from '@sector/domain/value-objects/climbing-style.vo'
import { Kudos } from '@sector/domain/value-objects/kudos.vo'
import { Orientation } from '@sector/domain/value-objects/orientation.vo'
import { PriceCategory } from '@sector/domain/value-objects/price-category.vo'
import { RockType } from '@sector/domain/value-objects/rock-type.vo'
import { SectorId } from '@sector/domain/value-objects/sector-id.vo'
import {
  SectorStats,
  type GradeDistribution,
} from '@sector/domain/value-objects/sector-stats.vo'
import { SunExposure } from '@sector/domain/value-objects/sun-exposure.vo'

export interface CragInfo {
  id: string
  name: string
  altNames: string[]
  latitude: number | null
  longitude: number | null
  description: string | null
  approach: string | null
  numberPhotos: number | null
  numberTopos: number | null
  hasTopo: boolean
  totalFavorites: number | null
  urlStub: string | null
  priceCategory: string | null
}

export interface SectorWithRoutes {
  entity: SectorEntity
  routes: RouteSearchInfo[]
  crag: CragInfo | null
}

interface SectorPrismaData {
  id: string
  externalId: bigint
  areaId: string
  name: string
  altNames: string[]
  type: string
  latitude: number | null
  longitude: number | null
  geometry: unknown
  locatedness: number | null
  orientation: string | null
  rockType: string | null
  climbingStyle: string[]
  sunExposure: string | null
  sheltered: boolean | null
  seasonality: number[]
  beta: unknown
  routeCount: number
  minGrade: string | null
  maxGrade: string | null
  avgGrade: string | null
  minGradeIndex: number | null
  maxGradeIndex: number | null
  avgGradeIndex: number | null
  gradeDistribution: unknown
  averageHeight: number | null
  maxHeight: number | null
  totalAscents: number | null
  avgStars: number | null
  numberPhotos: number | null
  numberTopos: number | null
  totalFavorites: number | null
  isTLC: boolean
  ascentCount: number | null
  maxPop: number | null
  priceCategory: string | null
  hasTopo: boolean
  kudos: number | null
  permitNode: unknown
  siblingLabel: string | null
  tagsRaw: unknown
  urlStub: string | null
  urlAncestorStub: string | null
  lastPDFSize: string | null
  lastPDFStaticDate: string | null
  redirectStubs: string[]
  tlc: unknown
  apiResponseRaw: unknown
  headerImageUrl: string | null
  headerImageWidth: number | null
  headerImageHeight: number | null
  createdAt: Date
  updatedAt: Date
}

export interface SectorFilter {
  areaId?: AreaId
  minGradeIndex?: number
  maxGradeIndex?: number
  minRoutes?: number
  hasTopo?: boolean
  orientation?: string
  rockType?: string
  hasOverhangs?: boolean
  limit?: number
  offset?: number
}

export interface AdvancedSearchFilters {
  // Geographic bounds
  latitudeMin: number
  latitudeMax: number
  longitudeMin: number
  longitudeMax: number

  // Grade range
  minGradeIndex: number
  maxGradeIndex: number

  // Optional filters
  minRoutes?: number
  rockTypes?: string[]
  climbingStyles?: string[]
  hasTopo?: boolean
  requiresNoPermit?: boolean

  // Pagination
  limit: number
  offset: number
}

@Injectable()
export class SectorPrismaRepository extends PrismaRepository<'sector'> {
  constructor(
    @Inject(PrismaClientOneJs) protected readonly prisma: PrismaClientOneJs,
  ) {
    super(prisma, 'sector')
  }

  async findById(id: SectorId): Promise<SectorEntity | null> {
    const sector = await this.prisma.sector.findUnique({
      where: { id: id.toString() },
    })
    return sector ? this.toEntity(sector) : null
  }

  async findByExternalId(externalId: ExternalId): Promise<SectorEntity | null> {
    const sector = await this.prisma.sector.findUnique({
      where: { externalId: externalId.toBigInt() },
    })
    return sector ? this.toEntity(sector) : null
  }

  async findByAreaId(areaId: AreaId): Promise<SectorEntity[]> {
    const sectors = await this.prisma.sector.findMany({
      where: { areaId: areaId.toString() },
      orderBy: { name: 'asc' },
    })
    return sectors.map((s: SectorPrismaData) => this.toEntity(s))
  }

  async findByGradeRange(
    minGradeIndex: number,
    maxGradeIndex: number,
    limit = 50,
  ): Promise<SectorEntity[]> {
    const sectors = await this.prisma.sector.findMany({
      where: {
        AND: [
          { minGradeIndex: { lte: maxGradeIndex } },
          { maxGradeIndex: { gte: minGradeIndex } },
        ],
      },
      orderBy: { routeCount: 'desc' },
      take: limit,
    })

    return sectors.map((s: SectorPrismaData) => this.toEntity(s))
  }

  async findWithFilters(filters: SectorFilter): Promise<SectorEntity[]> {
    const where: Record<string, unknown> = {}

    if (filters.areaId) {
      where.areaId = filters.areaId.toString()
    }

    if (filters.minGradeIndex !== undefined) {
      where.maxGradeIndex = { gte: filters.minGradeIndex }
    }

    if (filters.maxGradeIndex !== undefined) {
      where.minGradeIndex = { lte: filters.maxGradeIndex }
    }

    if (filters.minRoutes !== undefined) {
      where.routeCount = { gte: filters.minRoutes }
    }

    if (filters.hasTopo !== undefined) {
      where.hasTopo = filters.hasTopo
    }

    if (filters.orientation) {
      where.orientation = filters.orientation
    }

    if (filters.rockType) {
      where.rockType = filters.rockType
    }

    if (filters.hasOverhangs) {
      where.climbingStyle = { hasSome: ['Overhang', 'Roof'] }
    }

    const sectors = await this.prisma.sector.findMany({
      where,
      orderBy: { routeCount: 'desc' },
      take: filters.limit ?? 50,
      skip: filters.offset ?? 0,
    })

    return sectors.map((s: SectorPrismaData) => this.toEntity(s))
  }

  async findNearby(
    latitude: number,
    longitude: number,
    radiusKm: number = 50,
    limit: number = 20,
  ): Promise<SectorEntity[]> {
    const latDelta = radiusKm / 111
    const lonDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180))

    const sectors = await this.prisma.sector.findMany({
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
      orderBy: { routeCount: 'desc' },
      take: limit,
    })

    return sectors.map((s: SectorPrismaData) => this.toEntity(s))
  }

  async save(entity: SectorEntity): Promise<SectorEntity> {
    const data = this.toPrismaData(entity)

    const saved = await this.prisma.sector.upsert({
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
    entity: SectorEntity,
    apiResponseRaw?: Record<string, unknown>,
  ): Promise<SectorEntity> {
    const data = this.toPrismaData(entity)

    // Agregar apiResponseRaw si está disponible
    if (apiResponseRaw) {
      ;(data as any).apiResponseRaw = apiResponseRaw

      // Extraer campos adicionales desde apiResponseRaw
      const raw = apiResponseRaw as any

      // redirectStubs y tlc
      if (Array.isArray(raw.redirectStubs)) {
        ;(data as any).redirectStubs = raw.redirectStubs
      }
      if (raw.tlc) {
        ;(data as any).tlc = raw.tlc
      }
    }

    const saved = await this.prisma.sector.upsert({
      where: { externalId: entity.externalId.toBigInt() },
      create: data,
      update: {
        ...data,
        updatedAt: new Date(),
      },
    })

    return this.toEntity(saved)
  }

  async updateStats(entity: SectorEntity): Promise<void> {
    const stats = entity.stats

    await this.prisma.sector.update({
      where: { id: entity.id.toString() },
      data: {
        routeCount: stats.routeCount,
        minGrade: stats.minGrade,
        maxGrade: stats.maxGrade,
        avgGrade: stats.avgGrade,
        minGradeIndex: stats.minGradeIndex,
        maxGradeIndex: stats.maxGradeIndex,
        avgGradeIndex: stats.avgGradeIndex,
        gradeDistribution: stats.gradeDistribution,
        averageHeight: stats.averageHeight,
        maxHeight: stats.maxHeight,
        totalAscents: stats.totalAscents,
        avgStars: stats.avgStars,
        updatedAt: new Date(),
      },
    })
  }

  async delete(id: SectorId): Promise<void> {
    await this.prisma.sector.delete({ where: { id: id.toString() } })
  }

  async deleteByAreaId(areaId: AreaId): Promise<number> {
    const result = await this.prisma.sector.deleteMany({
      where: { areaId: areaId.toString() },
    })
    return result.count
  }

  async existsByExternalId(externalId: ExternalId): Promise<boolean> {
    const count = await this.prisma.sector.count({
      where: { externalId: externalId.toBigInt() },
    })
    return count > 0
  }

  /**
   * Advanced search for sectors with multiple filters
   * Used by the intelligent sector search feature
   *
   * Two-phase search:
   * 1. Find nearby crags (which have coordinates)
   * 2. Find sectors belonging to those crags with grade/other filters
   */
  async searchWithAdvancedFilters(
    filters: AdvancedSearchFilters,
  ): Promise<SectorWithRoutes[]> {
    // PHASE 1: Find crags within geographic bounds
    const nearbyCrags = await this.prisma.crag.findMany({
      where: {
        latitude: {
          gte: filters.latitudeMin,
          lte: filters.latitudeMax,
        },
        longitude: {
          gte: filters.longitudeMin,
          lte: filters.longitudeMax,
        },
      },
      select: {
        id: true,
        latitude: true,
        longitude: true,
      },
    })

    // If no nearby crags, return empty
    if (nearbyCrags.length === 0) {
      return []
    }

    const cragIds = nearbyCrags.map((c) => c.id)

    // PHASE 2: Find sectors from those crags with filters
    const where: Record<string, unknown> = {
      AND: [
        // Sectors belonging to nearby crags
        {
          area: {
            cragId: { in: cragIds },
          },
        },
        // Grade range overlap - also include sectors without grade data (null values)
        // This ensures we don't exclude sectors that haven't been indexed yet
        {
          OR: [
            { minGradeIndex: null },
            { minGradeIndex: { lte: filters.maxGradeIndex } },
          ],
        },
        {
          OR: [
            { maxGradeIndex: null },
            { maxGradeIndex: { gte: filters.minGradeIndex } },
          ],
        },
      ],
    }

    // Optional filters
    const additionalConditions: Record<string, unknown>[] = []

    if (filters.minRoutes !== undefined) {
      additionalConditions.push({ routeCount: { gte: filters.minRoutes } })
    }

    if (filters.hasTopo !== undefined) {
      additionalConditions.push({ hasTopo: filters.hasTopo })
    }

    if (filters.rockTypes && filters.rockTypes.length > 0) {
      additionalConditions.push({ rockType: { in: filters.rockTypes } })
    }

    if (filters.climbingStyles && filters.climbingStyles.length > 0) {
      additionalConditions.push({
        climbingStyle: { hasSome: filters.climbingStyles },
      })
    }

    if (filters.requiresNoPermit) {
      // Sectors without permit requirements
      // permitNode is null or doesn't have permit required
      additionalConditions.push({
        OR: [{ permitNode: null }, { permitNode: { equals: {} } }],
      })
    }

    if (additionalConditions.length > 0) {
      ;(where.AND as Record<string, unknown>[]).push(...additionalConditions)
    }

    const sectors = await this.prisma.sector.findMany({
      where,
      include: {
        area: {
          include: {
            crag: {
              select: {
                id: true,
                name: true,
                altNames: true,
                latitude: true,
                longitude: true,
                geometry: true,
                description: true,
                approach: true,
                numberPhotos: true,
                numberTopos: true,
                hasTopo: true,
                totalFavorites: true,
                urlStub: true,
                priceCategory: true,
              },
            },
          },
        },
        routes: {
          select: {
            id: true,
            externalId: true,
            name: true,
            grade: true,
            gradeIndex: true,
            height: true,
            pitches: true,
            bolts: true,
            stars: true,
            quality: true,
            ascents: true,
            subType: true,
            firstAscent: true,
            topoNumber: true,
          },
          orderBy: { gradeIndex: 'asc' },
        },
      },
      orderBy: { routeCount: 'desc' },
      take: filters.limit,
      skip: filters.offset,
    })

    // Map to entities with routes and crag info
    return sectors.map((s: any) => {
      const entity = this.toEntity(s)

      // Map routes to RouteSearchInfo
      const routes: RouteSearchInfo[] = (s.routes || []).map((r: any) => ({
        id: r.id,
        externalId: Number(r.externalId),
        name: r.name,
        grade: r.grade,
        gradeIndex: r.gradeIndex,
        height: r.height,
        pitches: r.pitches,
        bolts: r.bolts,
        stars: r.stars,
        quality: r.quality,
        ascents: r.ascents,
        subType: r.subType,
        firstAscent: r.firstAscent,
        topoNumber: r.topoNumber,
      }))

      // Extract crag info
      let cragInfo: CragInfo | null = null
      if (s.area?.crag) {
        const crag = s.area.crag
        cragInfo = {
          id: crag.id,
          name: crag.name,
          altNames: crag.altNames || [],
          latitude: crag.latitude,
          longitude: crag.longitude,
          description: crag.description,
          approach: crag.approach,
          numberPhotos: crag.numberPhotos,
          numberTopos: crag.numberTopos,
          hasTopo: crag.hasTopo,
          totalFavorites: crag.totalFavorites,
          urlStub: crag.urlStub,
          priceCategory: crag.priceCategory,
        }

        // If sector doesn't have coordinates, use crag's coordinates
        if (!entity.latitude && crag.latitude) {
          const updatedEntity = new SectorEntity(
            entity.id,
            entity.externalId,
            entity.areaId,
            entity.name,
            entity.altNames,
            entity.type,
            crag.geometry
              ? Geometry.fromJSON(crag.geometry as any)
              : entity.geometry,
            entity.locatedness,
            entity.orientation,
            entity.rockType,
            entity.climbingStyle,
            entity.sunExposure,
            entity.sheltered,
            entity.seasonality,
            entity.beta,
            entity.stats,
            entity.numberPhotos,
            entity.numberTopos,
            entity.totalFavorites,
            entity.isTLC,
            entity.ascentCount,
            entity.maxPop,
            entity.priceCategory,
            entity.hasTopo,
            entity.kudos,
            entity.permitNode,
            entity.siblingLabel,
            entity.tagsRaw,
            entity.urlStub,
            entity.urlAncestorStub,
            entity.lastPDFSize,
            entity.lastPDFStaticDate,
            entity.createdAt,
            entity.updatedAt,
          )
          return { entity: updatedEntity, routes, crag: cragInfo }
        }
      }
      return { entity, routes, crag: cragInfo }
    })
  }

  private toEntity(data: SectorPrismaData): SectorEntity {
    return new SectorEntity(
      SectorId.fromString(data.id),
      ExternalId.create(data.externalId),
      AreaId.fromString(data.areaId),
      Name.create(data.name),
      AltNames.create(data.altNames),
      data.type as SectorType,
      Geometry.fromJSON(data.geometry as Record<string, unknown>),
      Locatedness.create(data.locatedness),
      Orientation.create(data.orientation),
      RockType.create(data.rockType),
      ClimbingStyle.create(data.climbingStyle),
      SunExposure.create(data.sunExposure),
      data.sheltered,
      Seasonality.create(data.seasonality),
      BetaInfo.fromJSON(data.beta as BetaItemData[]),
      new SectorStats(
        data.routeCount,
        data.minGrade,
        data.maxGrade,
        data.avgGrade,
        data.minGradeIndex,
        data.maxGradeIndex,
        data.avgGradeIndex,
        (data.gradeDistribution as GradeDistribution) ?? {},
        data.averageHeight,
        data.maxHeight,
        data.totalAscents,
        data.avgStars,
      ),
      data.numberPhotos,
      data.numberTopos,
      data.totalFavorites,
      data.isTLC,
      data.ascentCount,
      data.maxPop,
      PriceCategory.create(data.priceCategory),
      data.hasTopo,
      Kudos.create(data.kudos),
      PermitInfo.create(data.permitNode),
      data.siblingLabel,
      data.tagsRaw as Record<string, unknown> | null,
      data.urlStub,
      data.urlAncestorStub,
      data.lastPDFSize,
      data.lastPDFStaticDate,
      data.createdAt,
      data.updatedAt,
      data.headerImageUrl,
      data.headerImageWidth,
      data.headerImageHeight,
    )
  }

  /**
   * Get total sector count for multiple crags
   */
  async getSectorCountsByCragIds(
    cragIds: string[],
  ): Promise<Map<string, number>> {
    const counts = await this.prisma.sector.groupBy({
      by: ['areaId'],
      where: {
        area: {
          cragId: { in: cragIds },
        },
      },
      _count: {
        id: true,
      },
    })

    // Get area to crag mapping
    const areas = await this.prisma.area.findMany({
      where: {
        cragId: { in: cragIds },
      },
      select: {
        id: true,
        cragId: true,
      },
    })

    const areaToCrag = new Map<string, string>()
    for (const area of areas) {
      areaToCrag.set(area.id, area.cragId)
    }

    // Aggregate counts by crag
    const cragCounts = new Map<string, number>()
    for (const count of counts) {
      const cragId = areaToCrag.get(count.areaId)
      if (cragId) {
        cragCounts.set(cragId, (cragCounts.get(cragId) || 0) + count._count.id)
      }
    }

    return cragCounts
  }

  private toPrismaData(entity: SectorEntity) {
    return {
      id: entity.id.toString(),
      externalId: entity.externalId.toBigInt(),
      areaId: entity.areaId.toString(),
      name: entity.name.toString(),
      altNames: entity.altNames.toArray(),
      type: entity.type,
      latitude: entity.latitude,
      longitude: entity.longitude,
      geometry: entity.geometry?.toJSON() ?? null,
      locatedness: entity.locatedness?.toNumber() ?? null,
      orientation: entity.orientation?.toString() ?? null,
      rockType: entity.rockType?.toString() ?? null,
      climbingStyle: entity.climbingStyle.toArray(),
      sunExposure: entity.sunExposure?.toString() ?? null,
      sheltered: entity.sheltered,
      seasonality: entity.seasonality.toArray(),
      beta: entity.beta.toJSON(),
      routeCount: entity.stats.routeCount,
      minGrade: entity.stats.minGrade,
      maxGrade: entity.stats.maxGrade,
      avgGrade: entity.stats.avgGrade,
      minGradeIndex: entity.stats.minGradeIndex,
      maxGradeIndex: entity.stats.maxGradeIndex,
      avgGradeIndex: entity.stats.avgGradeIndex,
      gradeDistribution: entity.stats.gradeDistribution,
      averageHeight: entity.stats.averageHeight,
      maxHeight: entity.stats.maxHeight,
      totalAscents: entity.stats.totalAscents,
      avgStars: entity.stats.avgStars,
      numberPhotos: entity.numberPhotos,
      numberTopos: entity.numberTopos,
      totalFavorites: entity.totalFavorites,
      isTLC: entity.isTLC,
      ascentCount: entity.ascentCount,
      maxPop: entity.maxPop,
      priceCategory: entity.priceCategory?.toString() ?? null,
      hasTopo: entity.hasTopo,
      kudos: entity.kudos?.toNumber() ?? null,
      permitNode: entity.permitNode.toJSON(),
      siblingLabel: entity.siblingLabel,
      tagsRaw: entity.tagsRaw,
      urlStub: entity.urlStub,
      urlAncestorStub: entity.urlAncestorStub,
      lastPDFSize: entity.lastPDFSize,
      lastPDFStaticDate: entity.lastPDFStaticDate,
      headerImageUrl: entity.headerImageUrl,
      headerImageWidth: entity.headerImageWidth,
      headerImageHeight: entity.headerImageHeight,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }
  }

  /**
   * Update header image for a sector
   */
  async updateHeaderImage(
    sectorId: SectorId,
    headerImageUrl: string,
    headerImageWidth?: number,
    headerImageHeight?: number,
  ): Promise<void> {
    await this.prisma.sector.update({
      where: { id: sectorId.toString() },
      data: {
        headerImageUrl,
        headerImageWidth: headerImageWidth ?? null,
        headerImageHeight: headerImageHeight ?? null,
        updatedAt: new Date(),
      },
    })
  }
}
