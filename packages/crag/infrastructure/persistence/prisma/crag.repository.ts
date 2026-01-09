import { Inject, Injectable } from '@OneJs/core'
import { PrismaClientOneJs, PrismaRepository } from '@OneJs/prisma'
import { CountryId } from '@climb-zone/country'
import { RegionId } from '@climb-zone/region'
import {
  AltNames,
  BetaInfo,
  ExternalId,
  Geometry,
  Locatedness,
  Name,
  PermitInfo,
  Seasonality,
  Url,
} from '@climb-zone/shared'
import { CragEntity } from '@crag/domain/entities/crag.entity'
import { CragId } from '@crag/domain/value-objects/crag-id.vo'
import { PriceCategory } from '@crag/domain/value-objects/price-category.vo'
import { Kudos } from '@crag/domain/value-objects/kudos.vo'

interface CragPrismaData {
  id: string
  externalId: bigint
  countryId: string
  regionId: string | null
  name: string
  altNames: string[]
  latitude: number | null
  longitude: number | null
  geometry: unknown
  locatedness: number | null
  seasonality: number[]
  description: string | null
  approach: string | null
  ethic: string | null
  numberPhotos: number | null
  numberTopos: number | null
  hasTopo: boolean
  totalFavorites: number | null
  kudos: number | null
  ascentCount: number | null
  maxPop: number | null
  priceCategory: string | null
  permitNode: unknown
  tagsRaw: unknown
  sourceUrl: string
  urlStub: string | null
  urlAncestorStub: string | null
  lastPDFSize: string | null
  lastPDFStaticDate: string | null
  averageHeight: number | null
  numberRoutes: number | null
  subAreaCount: number | null
  redirectStubs: string[]
  tlc: unknown
  lastPDFStaticSize: string | null
  apiResponseRaw: unknown
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

  /**
   * Find crags within a distance range with optional name search
   * Returns crags sorted by distance from the given coordinates
   */
  async findNearbyWithSearch(params: {
    latitude: number
    longitude: number
    maxDistanceKm: number
    search?: string
    limit?: number
    offset?: number
  }): Promise<{ crags: CragEntity[]; total: number }> {
    const { latitude, longitude, maxDistanceKm, search, limit = 50, offset = 0 } = params

    // Calculate bounding box for initial filtering (1 degree ≈ 111km)
    const latDelta = maxDistanceKm / 111
    const lonDelta = maxDistanceKm / (111 * Math.cos((latitude * Math.PI) / 180))

    const latMin = latitude - latDelta
    const latMax = latitude + latDelta
    const lonMin = longitude - lonDelta
    const lonMax = longitude + lonDelta

    // Build where clause
    const whereClause: Record<string, unknown> = {
      latitude: { gte: latMin, lte: latMax },
      longitude: { gte: lonMin, lte: lonMax },
    }

    // Add search filter if provided
    if (search && search.trim().length > 0) {
      const searchTerm = search.trim().toLowerCase()
      whereClause.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { altNames: { hasSome: [searchTerm] } },
      ]
    }

    // Get total count
    const total = await this.prisma.crag.count({ where: whereClause })

    // Fetch crags with pagination
    const crags = await this.prisma.crag.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
      take: limit,
      skip: offset,
    })

    // Convert to entities and calculate actual distance
    const entities = crags.map((crag: CragPrismaData) => this.toEntity(crag))

    // Sort by distance
    entities.sort((a, b) => {
      const distA = this.haversineDistance(latitude, longitude, a.latitude!, a.longitude!)
      const distB = this.haversineDistance(latitude, longitude, b.latitude!, b.longitude!)
      return distA - distB
    })

    // Filter by actual distance (bounding box may include corners outside radius)
    const filtered = entities.filter((crag) => {
      if (crag.latitude === null || crag.longitude === null) return false
      const dist = this.haversineDistance(latitude, longitude, crag.latitude, crag.longitude)
      return dist <= maxDistanceKm
    })

    return { crags: filtered, total }
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371 // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
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

  async saveByExternalId(
    entity: CragEntity,
    apiResponseRaw?: Record<string, unknown>,
  ): Promise<CragEntity> {
    const data = this.toPrismaData(entity)
    
    // Agregar apiResponseRaw si está disponible
    if (apiResponseRaw) {
      (data as any).apiResponseRaw = apiResponseRaw
      
      // Extraer campos adicionales desde apiResponseRaw
      const raw = apiResponseRaw as any
      
      // averageHeight viene como [valor, "m"]
      if (raw.averageHeight && Array.isArray(raw.averageHeight)) {
        const height = Number(raw.averageHeight[0])
        if (!isNaN(height)) {
          (data as any).averageHeight = height
        }
      }
      
      // Otros campos simples
      if (raw.numberRoutes !== undefined) {
        (data as any).numberRoutes = raw.numberRoutes
      }
      if (raw.subAreaCount !== undefined) {
        (data as any).subAreaCount = raw.subAreaCount
      }
      if (Array.isArray(raw.redirectStubs)) {
        (data as any).redirectStubs = raw.redirectStubs
      }
      if (raw.tlc) {
        (data as any).tlc = raw.tlc
      }
      if (raw.lastPDFStaticSize) {
        (data as any).lastPDFStaticSize = raw.lastPDFStaticSize
      }
    }

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
      AltNames.create(data.altNames),
      Geometry.fromJSON(data.geometry as Record<string, unknown>),
      Locatedness.create(data.locatedness),
      Seasonality.create(data.seasonality),
      BetaInfo.fromJSON(betaItems),
      data.numberPhotos,
      data.numberTopos,
      data.hasTopo,
      data.totalFavorites,
      Kudos.create(data.kudos),
      data.ascentCount,
      data.maxPop,
      PriceCategory.create(data.priceCategory),
      PermitInfo.create(data.permitNode),
      data.tagsRaw as Record<string, unknown> | null,
      Url.create(data.sourceUrl),
      data.urlStub,
      data.urlAncestorStub,
      data.lastPDFSize,
      data.lastPDFStaticDate,
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
      altNames: entity.altNames.toArray(),
      latitude: entity.latitude,
      longitude: entity.longitude,
      geometry: entity.geometry?.toJSON() ?? null,
      locatedness: entity.locatedness?.toNumber() ?? null,
      seasonality: entity.seasonality.toArray(),
      description: entity.description,
      approach: entity.approach,
      ethic: entity.ethic,
      numberPhotos: entity.numberPhotos,
      numberTopos: entity.numberTopos,
      hasTopo: entity.hasTopo,
      totalFavorites: entity.totalFavorites,
      kudos: entity.kudos?.toNumber() ?? null,
      ascentCount: entity.ascentCount,
      maxPop: entity.maxPop,
      priceCategory: entity.priceCategory?.toString() ?? null,
      permitNode: entity.permitNode.toJSON(),
      tagsRaw: entity.tagsRaw,
      sourceUrl: entity.sourceUrl.toString(),
      urlStub: entity.urlStub,
      urlAncestorStub: entity.urlAncestorStub,
      lastPDFSize: entity.lastPDFSize,
      lastPDFStaticDate: entity.lastPDFStaticDate,
      apiResponseRaw: null, // Placeholder
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }
  }
}
