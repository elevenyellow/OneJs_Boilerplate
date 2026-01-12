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
import { CragId } from '@crag/domain/value-objects/crag-id.vo'
import type {
  AdvancedSearchFilters,
  CragInfo,
  GradeRangeQueryDto,
  NearbySectorsQueryDto,
  RouteSearchInfo,
  SectorFilterDto,
  SectorWithRoutesDto,
} from '@sector/domain/dtos/search-sectors.dto'
import type {
  HeaderImageDto,
  HeaderImageS3Dto,
} from '@sector/domain/dtos/sector-image.dto'
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
import { SectorTags } from '@sector/domain/value-objects/sector-tags.vo'
import { SunExposure } from '@sector/domain/value-objects/sun-exposure.vo'

/**
 * Internal Prisma data structure for sector records
 * This maps directly to the Prisma model and is used for conversion to/from entities
 */
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
  // Tags procesados
  kidFriendly: boolean | null
  beginner: boolean | null
  dogFriendly: boolean | null
  accessible: boolean | null
  camping: boolean | null
  swimming: boolean | null
  scenic: boolean | null
  popular: boolean | null
  quiet: boolean | null
  multipitch: boolean | null
  trad: boolean | null
  sport: boolean | null
  bouldering: boolean | null
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
  // S3 optimized images
  headerImageS3Url: string | null
  headerImageS3UrlFull: string | null
  headerImageOriginalUrl: string | null
  createdAt: Date
  updatedAt: Date
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

  /**
   * Find all sectors belonging to a crag (through areas)
   * Returns sectors ordered by favorites and route count
   */
  async findByCragId(cragId: CragId): Promise<SectorEntity[]> {
    const sectors = await this.prisma.sector.findMany({
      where: {
        area: {
          cragId: cragId.toString(),
        },
      },
      orderBy: [{ totalFavorites: 'desc' }, { routeCount: 'desc' }],
    })
    return sectors.map((s: SectorPrismaData) => this.toEntity(s))
  }

  /**
   * Get route counts per sector for a list of sector IDs
   */
  async getRouteCountsBySectorIds(
    sectorIds: SectorId[],
  ): Promise<Map<string, number>> {
    const sectorIdStrings = sectorIds.map((id) => id.toString())
    const counts = await this.prisma.route.groupBy({
      by: ['sectorId'],
      where: {
        sectorId: { in: sectorIdStrings },
      },
      _count: { id: true },
    })
    return new Map(counts.map((r) => [r.sectorId, r._count.id]))
  }

  async findByGradeRange(query: GradeRangeQueryDto): Promise<SectorEntity[]> {
    const sectors = await this.prisma.sector.findMany({
      where: {
        AND: [
          { minGradeIndex: { lte: query.maxGradeIndex } },
          { maxGradeIndex: { gte: query.minGradeIndex } },
        ],
      },
      orderBy: { routeCount: 'desc' },
      take: query.limit ?? 50,
    })

    return sectors.map((s: SectorPrismaData) => this.toEntity(s))
  }

  async findWithFilters(filters: SectorFilterDto): Promise<SectorEntity[]> {
    const where: Record<string, unknown> = {}

    if (filters.areaId) {
      where.areaId = filters.areaId
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

  async findNearby(query: NearbySectorsQueryDto): Promise<SectorEntity[]> {
    const radiusKm = query.radiusKm ?? 50
    const limit = query.limit ?? 20
    const latDelta = radiusKm / 111
    const lonDelta =
      radiusKm / (111 * Math.cos((query.latitude * Math.PI) / 180))

    const sectors = await this.prisma.sector.findMany({
      where: {
        latitude: {
          gte: query.latitude - latDelta,
          lte: query.latitude + latDelta,
        },
        longitude: {
          gte: query.longitude - lonDelta,
          lte: query.longitude + lonDelta,
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
    const data = this.toPrismaData(entity) as ReturnType<
      typeof this.toPrismaData
    > & {
      apiResponseRaw?: Record<string, unknown>
      redirectStubs?: string[]
      tlc?: unknown
    }

    // Agregar apiResponseRaw si está disponible
    if (apiResponseRaw) {
      data.apiResponseRaw = apiResponseRaw

      // Extraer campos adicionales desde apiResponseRaw
      // redirectStubs y tlc
      if (
        'redirectStubs' in apiResponseRaw &&
        Array.isArray(apiResponseRaw.redirectStubs)
      ) {
        data.redirectStubs = apiResponseRaw.redirectStubs as string[]
      }
      if ('tlc' in apiResponseRaw && apiResponseRaw.tlc) {
        data.tlc = apiResponseRaw.tlc
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
  ): Promise<SectorWithRoutesDto[]> {
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

    // Map to DTOs with routes and crag info
    const mappedResults: SectorWithRoutesDto[] = sectors.map((s) => {
      const sectorData = s as SectorPrismaData
      let entity = this.toEntity(sectorData)

      // Map routes to RouteSearchInfo
      const routes: RouteSearchInfo[] = (s.routes || []).map((r) => ({
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
      const crag = s.area?.crag
      if (crag) {
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

        // If sector doesn't have coordinates, inherit from crag geometry
        if (!entity.latitude && crag.geometry) {
          const cragGeometry = Geometry.fromJSON(
            crag.geometry as Record<string, unknown>,
          )
          const coords = cragGeometry?.getCoordinates()
          if (coords) {
            // Create new entity with inherited coordinates
            entity = entity.withCoordinates(coords.latitude, coords.longitude)
          }
        }
      }

      return { entity, routes, crag: cragInfo }
    })

    // Apply tag-based filters in memory (tags are stored as JSON and processed dynamically)
    const hasTagFilters =
      filters.kidFriendly !== undefined ||
      filters.dogFriendly !== undefined ||
      filters.beginner !== undefined ||
      filters.accessible !== undefined

    if (!hasTagFilters) {
      return mappedResults
    }

    return mappedResults.filter((result) => {
      const tags = SectorTags.create(result.entity.tagsRaw)

      // Kid friendly filter
      if (filters.kidFriendly !== undefined) {
        if (filters.kidFriendly === true) {
          // Require kid friendly OR not explicitly marked as not kid friendly
          if (tags.kidFriendly === false) return false
        } else {
          // Exclude sectors marked as kid friendly (user wants challenging areas?)
          if (tags.kidFriendly === true) return false
        }
      }

      // Dog friendly filter
      if (filters.dogFriendly === true && tags.dogFriendly !== true) {
        return false
      }

      // Beginner filter
      if (filters.beginner === true && tags.beginner !== true) {
        return false
      }

      // Accessible filter
      if (filters.accessible === true && tags.accessible !== true) {
        return false
      }

      return true
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
      // Tags procesados
      data.kidFriendly,
      data.beginner,
      data.dogFriendly,
      data.accessible,
      data.camping,
      data.swimming,
      data.scenic,
      data.popular,
      data.quiet,
      data.multipitch,
      data.trad,
      data.sport,
      data.bouldering,
      data.urlStub,
      data.urlAncestorStub,
      data.lastPDFSize,
      data.lastPDFStaticDate,
      data.createdAt,
      data.updatedAt,
      data.headerImageUrl,
      data.headerImageWidth,
      data.headerImageHeight,
      data.headerImageS3Url,
      data.headerImageS3UrlFull,
      data.headerImageOriginalUrl,
    )
  }

  /**
   * Get total sector count for multiple crags
   */
  async getSectorCountsByCragIds(
    cragIds: CragId[],
  ): Promise<Map<string, number>> {
    const cragIdStrings = cragIds.map((id) => id.toString())
    const counts = await this.prisma.sector.groupBy({
      by: ['areaId'],
      where: {
        area: {
          cragId: { in: cragIdStrings },
        },
      },
      _count: {
        id: true,
      },
    })

    // Get area to crag mapping
    const areas = await this.prisma.area.findMany({
      where: {
        cragId: { in: cragIdStrings },
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
      // Tags procesados
      kidFriendly: entity.kidFriendly,
      beginner: entity.beginner,
      dogFriendly: entity.dogFriendly,
      accessible: entity.accessible,
      camping: entity.camping,
      swimming: entity.swimming,
      scenic: entity.scenic,
      popular: entity.popular,
      quiet: entity.quiet,
      multipitch: entity.multipitch,
      trad: entity.trad,
      sport: entity.sport,
      bouldering: entity.bouldering,
      urlStub: entity.urlStub,
      urlAncestorStub: entity.urlAncestorStub,
      lastPDFSize: entity.lastPDFSize,
      lastPDFStaticDate: entity.lastPDFStaticDate,
      headerImageUrl: entity.headerImageUrl,
      headerImageWidth: entity.headerImageWidth,
      headerImageHeight: entity.headerImageHeight,
      headerImageS3Url: entity.headerImageS3Url,
      headerImageS3UrlFull: entity.headerImageS3UrlFull,
      headerImageOriginalUrl: entity.headerImageOriginalUrl,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }
  }

  /**
   * Update header image for a sector
   */
  async updateHeaderImage(
    sectorId: SectorId,
    headerImage: HeaderImageDto,
  ): Promise<void> {
    await this.prisma.sector.update({
      where: { id: sectorId.toString() },
      data: {
        headerImageUrl: headerImage.headerImageUrl,
        headerImageWidth: headerImage.headerImageWidth ?? null,
        headerImageHeight: headerImage.headerImageHeight ?? null,
        updatedAt: new Date(),
      },
    })
  }

  /**
   * Update S3 header images for a sector
   */
  async updateHeaderImageS3(
    sectorId: SectorId,
    s3Urls: HeaderImageS3Dto,
  ): Promise<void> {
    await this.prisma.sector.update({
      where: { id: sectorId.toString() },
      data: {
        headerImageS3Url: s3Urls.s3Url,
        headerImageS3UrlFull: s3Urls.s3UrlFull,
        headerImageOriginalUrl: s3Urls.originalUrl,
        updatedAt: new Date(),
      },
    })
  }
}
