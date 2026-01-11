import { Injectable } from '@OneJs/core'
import { AreaId } from '@area/domain/value-objects/area-id.vo'
import { AreaEntity, type AreaType } from '@climb-zone/area'
import { CountryId, CragEntity } from '@climb-zone/crag'
import { RegionId } from '@climb-zone/region'
import { RouteEntity } from '@climb-zone/route'
import {
  SectorEntity,
  type SectorType,
  Orientation,
  RockType,
  ClimbingStyle,
  SunExposure,
} from '@climb-zone/sector'
import type { GeometryData } from '@climb-zone/shared'
import {
  BetaInfo,
  ExternalId,
  Geometry,
  Grade,
  Name,
  Seasonality,
  Url,
  AltNames,
  Locatedness,
  PermitInfo,
} from '@climb-zone/shared'
import { CragId } from '@crag/domain/value-objects/crag-id.vo'
import { RouteId } from '@route/domain/value-objects/route-id.vo'
import { Height } from '@route/domain/value-objects/height.vo'
import { Rating } from '@route/domain/value-objects/rating.vo'
import { Pitches } from '@route/domain/value-objects/pitches.vo'
import { Bolts } from '@route/domain/value-objects/bolts.vo'
import { Quality } from '@route/domain/value-objects/quality.vo'
import { Ascents } from '@route/domain/value-objects/ascents.vo'
import { FirstAscent } from '@route/domain/value-objects/first-ascent.vo'
import { RouteType } from '@route/domain/value-objects/route-type.vo'
import { Tags } from '@route/domain/value-objects/tags.vo'
import { Warnings } from '@route/domain/value-objects/warnings.vo'
import { TopoNumber } from '@route/domain/value-objects/topo-number.vo'
import type {
  ScrapedNodeInfo,
  ScrapedRouteData,
} from '@scraper-thecrag/domain/dtos/scraped-node.dto'
import { SectorId } from '@sector/domain/value-objects/sector-id.vo'
import { SectorStats } from '@climb-zone/sector'
import { PriceCategory } from '@sector/domain/value-objects/price-category.vo'
import { Kudos } from '@sector/domain/value-objects/kudos.vo'

/**
 * Validated data for creating a Crag entity
 * All fields are already validated Value Objects
 */
export interface ValidatedCragData {
  id: CragId
  externalId: ExternalId
  countryId: CountryId
  regionId: RegionId | null
  name: Name
  altNames: AltNames
  geometry: Geometry | null
  locatedness: Locatedness | null
  seasonality: Seasonality
  beta: BetaInfo
  numberPhotos: number | null
  numberTopos: number | null
  hasTopo: boolean
  totalFavorites: number | null
  kudos: Kudos | null
  ascentCount: number | null
  maxPop: number | null
  priceCategory: PriceCategory | null
  permitNode: PermitInfo
  tagsRaw: Record<string, unknown> | null
  sourceUrl: Url
  urlStub: string | null
  urlAncestorStub: string | null
  lastPDFSize: string | null
  lastPDFStaticDate: string | null
  // Additional fields from TheCrag API
  averageHeight: number | null
  numberRoutes: number | null
  subAreaCount: number | null
  redirectStubs: string[]
  tlc: Record<string, unknown> | null
  lastPDFStaticSize: string | null
  apiResponseRaw: Record<string, unknown> | null
  // Header image (solo URL)
  headerImageUrl: string | null
}

/**
 * Validated data for creating an Area entity
 */
export interface ValidatedAreaData {
  id: AreaId
  externalId: ExternalId
  cragId: CragId
  parentAreaId: AreaId | null
  name: Name
  altNames: AltNames
  type: AreaType
  geometry: Geometry | null
  seasonality: Seasonality
  beta: BetaInfo
  locatedness: Locatedness | null
  averageHeight: number | null
  numberRoutes: number | null
  permitNode: PermitInfo
  priceCategory: PriceCategory | null
  urlAncestorStub: string | null
  redirectStubs: string[]
  tlc: Record<string, unknown> | null
  apiResponseRaw: Record<string, unknown> | null
}

/**
 * Validated data for creating a Sector entity
 */
export interface ValidatedSectorData {
  id: SectorId
  externalId: ExternalId
  areaId: AreaId
  name: Name
  altNames: AltNames
  type: SectorType
  geometry: Geometry | null
  locatedness: Locatedness | null
  orientation: Orientation | null
  rockType: RockType | null
  climbingStyle: ClimbingStyle
  sunExposure: SunExposure | null
  sheltered: boolean | null
  seasonality: Seasonality
  beta: BetaInfo
  stats: SectorStats
  numberPhotos: number | null
  numberTopos: number | null
  totalFavorites: number | null
  isTLC: boolean
  ascentCount: number | null
  maxPop: number | null
  priceCategory: PriceCategory | null
  hasTopo: boolean
  kudos: Kudos | null
  permitNode: PermitInfo
  siblingLabel: string | null
  tagsRaw: Record<string, unknown> | null
  urlStub: string | null
  urlAncestorStub: string | null
  lastPDFSize: string | null
  lastPDFStaticDate: string | null
  redirectStubs: string[]
  tlc: Record<string, unknown> | null
  apiResponseRaw: Record<string, unknown> | null
  // Header image (solo URL)
  headerImageUrl: string | null
}

/**
 * Validated data for creating a Route entity
 */
export interface ValidatedRouteData {
  id: RouteId
  externalId: ExternalId
  sectorId: SectorId
  name: Name
  grade: Grade | null
  height: Height | null
  pitches: Pitches | null
  bolts: Bolts | null
  rating: Rating | null
  quality: Quality | null
  ascents: Ascents | null
  routeType: RouteType | null
  firstAscent: FirstAscent | null
  tags: Tags
  warnings: Warnings
  topoNumber: TopoNumber | null
}

/**
 * Service that maps scraped data to validated Value Objects
 * All validation happens here, before entities are created
 */
@Injectable()
export class ScrapedDataMapperService {
  /**
   * Map scraped data to validated Crag data
   * @throws Error if validation fails (e.g., invalid externalId)
   */
  mapToCrag(
    rawExternalId: number,
    rawName: string,
    countryId: CountryId,
    geometryData: GeometryData | null | undefined,
    info: ScrapedNodeInfo | null,
    regionId: RegionId | null = null,
  ): ValidatedCragData {
    const externalId = ExternalId.create(rawExternalId)
    const geometry = geometryData ? Geometry.fromJSON(geometryData) : null
    const beta = BetaInfo.fromJSON(info?.beta)
    const name = Name.create(rawName)
    const seasonality = Seasonality.create(info?.seasonality)
    const sourceUrl = Url.forTheCrag(info?.urlStub, rawExternalId)

    // Alta prioridad
    const altNames = AltNames.create(info?.altNames)
    const locatedness = Locatedness.create(info?.locatedness)
    const numberPhotos = info?.numberPhotos ?? null
    const numberTopos = info?.numberTopos ?? null
    const hasTopo = Boolean(info?.hasTopo)
    const totalFavorites = info?.totalFavorites ?? null
    const kudos = Kudos.create(info?.kudos)
    const urlStub = info?.urlStub ?? null
    const urlAncestorStub = info?.urlAncestorStub ?? null

    // Media prioridad
    const ascentCount = info?.ascentCount ?? null
    const maxPop = info?.maxPop ?? null
    const priceCategory = PriceCategory.create(info?.priceCategory)
    const permitNode = PermitInfo.create(info?.permitNode)
    const tagsRaw = info?.tags ?? null
    const lastPDFSize = info?.lastPDFSize ?? null
    const lastPDFStaticDate = info?.lastPDFStaticDate ?? null

    // Extraer campos adicionales desde apiResponseRaw
    const raw = info?.apiResponseRaw as any
    
    // Extraer averageHeight (formato TheCrag: [valor, "m"])
    let averageHeight: number | null = null
    if (raw?.averageHeight && Array.isArray(raw.averageHeight)) {
      averageHeight = Number(raw.averageHeight[0])
      if (isNaN(averageHeight)) averageHeight = null
    }
    
    const numberRoutes = raw?.numberRoutes ?? info?.numberRoutes ?? null
    const subAreaCount = raw?.subAreaCount ?? info?.subAreaCount ?? null
    const redirectStubs = Array.isArray(raw?.redirectStubs) ? raw.redirectStubs : []
    const tlc = raw?.tlc ?? null
    const lastPDFStaticSize = raw?.lastPDFStaticSize ?? info?.lastPDFStaticSize ?? null

    // Header image (solo URL)
    const headerImageUrl = info?.headerImageUrl ?? null

    return {
      id: CragId.generate(),
      externalId,
      countryId,
      regionId,
      name,
      altNames,
      geometry,
      locatedness,
      seasonality,
      beta,
      numberPhotos,
      numberTopos,
      hasTopo,
      totalFavorites,
      kudos,
      ascentCount,
      maxPop,
      priceCategory,
      permitNode,
      tagsRaw,
      sourceUrl,
      urlStub,
      urlAncestorStub,
      lastPDFSize,
      lastPDFStaticDate,
      averageHeight,
      numberRoutes,
      subAreaCount,
      redirectStubs,
      tlc,
      lastPDFStaticSize,
      apiResponseRaw: info?.apiResponseRaw ?? null,
      headerImageUrl,
    }
  }

  /**
   * Map scraped data to validated Area data
   */
  mapToArea(
    rawExternalId: number,
    rawName: string,
    cragId: CragId,
    parentAreaId: AreaId | null,
    geometryData: GeometryData | null | undefined,
    info: ScrapedNodeInfo | null,
    rawType?: string,
  ): ValidatedAreaData {
    const externalId = ExternalId.create(rawExternalId)
    const geometry = geometryData ? Geometry.fromJSON(geometryData) : null
    const beta = BetaInfo.fromJSON(info?.beta)
    const name = Name.create(rawName)
    const type = this.validateAreaType(rawType)
   
   // Alta prioridad
   const altNames = AltNames.create(info?.altNames)
   const seasonality = Seasonality.create(info?.seasonality)

   // Extraer campos adicionales desde apiResponseRaw
   const raw = info?.apiResponseRaw as any
   const locatedness = Locatedness.create(raw?.locatedness ?? info?.locatedness)
   const permitNode = PermitInfo.create(raw?.permitNode ?? info?.permitNode)
   const priceCategory = PriceCategory.create(raw?.priceCategory ?? info?.priceCategory)
   const urlAncestorStub = raw?.urlAncestorStub ?? info?.urlAncestorStub ?? null
   
   // Extraer averageHeight (formato TheCrag: [valor, "m"])
   let averageHeight: number | null = null
   if (raw?.averageHeight && Array.isArray(raw.averageHeight)) {
     averageHeight = Number(raw.averageHeight[0])
     if (isNaN(averageHeight)) averageHeight = null
   }
   
   const numberRoutes = raw?.numberRoutes ?? info?.numberRoutes ?? null
   const redirectStubs = Array.isArray(raw?.redirectStubs) ? raw.redirectStubs : []
   const tlc = raw?.tlc ?? null

   return {
     id: AreaId.generate(),
     externalId,
     cragId,
     parentAreaId,
     name,
     altNames,
     type,
     geometry,
     seasonality,
     beta,
     locatedness,
     averageHeight,
     numberRoutes,
     permitNode,
     priceCategory,
     urlAncestorStub,
     redirectStubs,
     tlc,
     apiResponseRaw: info?.apiResponseRaw ?? null,
   }
  }

  /**
   * Map scraped data to validated Sector data
   */
  mapToSector(
    rawExternalId: number,
    rawName: string,
    areaId: AreaId,
    geometryData: GeometryData | null | undefined,
    info: ScrapedNodeInfo | null,
    rawType?: string,
  ): ValidatedSectorData {
    const externalId = ExternalId.create(rawExternalId)
    const geometry = geometryData ? Geometry.fromJSON(geometryData) : null
    const beta = BetaInfo.fromJSON(info?.beta)
    const name = Name.create(rawName)
    const type = this.validateSectorType(rawType)
    const seasonality = Seasonality.create(info?.seasonality)
    const priceCategory = PriceCategory.create(info?.priceCategory)
    const kudos = Kudos.create(info?.kudos)

    // Parse tag fields (ya existentes)
    const orientation = Orientation.create(info?.orientation)
    const rockType = RockType.create(info?.rockType)
    const climbingStyle = ClimbingStyle.create(info?.climbingStyle)
    const sunExposure = SunExposure.create(info?.sunExposure)
    const sheltered = info?.sheltered ?? null
    const tagsRaw = info?.tags ?? null

    // Alta prioridad (NUEVOS)
    const altNames = AltNames.create(info?.altNames)
    const locatedness = Locatedness.create(info?.locatedness)
    const numberPhotos = info?.numberPhotos ?? null
    const numberTopos = info?.numberTopos ?? null
    const totalFavorites = info?.totalFavorites ?? null
    const isTLC = Boolean(info?.isTLC)
    const urlStub = info?.urlStub ?? null
    const urlAncestorStub = info?.urlAncestorStub ?? null

    // Media prioridad (NUEVOS)
    const ascentCount = info?.ascentCount ?? null
    const maxPop = info?.maxPop ?? null
    const permitNode = PermitInfo.create(info?.permitNode)
    const siblingLabel = info?.siblingLabel ? String(info?.siblingLabel) : null
    const lastPDFSize = info?.lastPDFSize ?? null
    const lastPDFStaticDate = info?.lastPDFStaticDate ?? null

    // Extraer campos adicionales desde apiResponseRaw
    const raw = info?.apiResponseRaw as any
    const redirectStubs = Array.isArray(raw?.redirectStubs) ? raw.redirectStubs : []
    const tlc = raw?.tlc ?? null

    // Header image (solo URL)
    const headerImageUrl = info?.headerImageUrl ?? null

    return {
      id: SectorId.generate(),
      externalId,
      areaId,
      name,
      altNames,
      type,
      geometry,
      locatedness,
      orientation,
      rockType,
      climbingStyle,
      sunExposure,
      sheltered,
      seasonality,
      beta,
      stats: SectorStats.empty(),
      numberPhotos,
      numberTopos,
      totalFavorites,
      isTLC,
      ascentCount,
      maxPop,
      priceCategory,
      hasTopo: Boolean(info?.hasTopo),
      kudos,
      permitNode,
      siblingLabel,
      tagsRaw,
      urlStub,
      urlAncestorStub,
      lastPDFSize,
      lastPDFStaticDate,
      redirectStubs,
      tlc,
      apiResponseRaw: info?.apiResponseRaw ?? null,
      headerImageUrl,
    }
  }

  /**
   * Map scraped route data to validated Route data
   * @param rawRoute - Raw route data from TheCrag API
   * @param sectorId - The sector this route belongs to
   * @param topoNumber - Optional topo number from topo annotation data
   */
  mapToRoute(
    rawRoute: ScrapedRouteData,
    sectorId: SectorId,
    topoNumber?: string | null,
  ): ValidatedRouteData {
    const externalId = ExternalId.create(rawRoute.id)
    const name = Name.create(rawRoute.name)
    const grade = rawRoute.grade
      ? new Grade(rawRoute.grade, 'french', rawRoute.gradeIndex ?? undefined)
      : null

    return {
      id: RouteId.generate(),
      externalId,
      sectorId,
      name,
      grade,
      height: Height.create(rawRoute.height),
      pitches: Pitches.create(rawRoute.pitches),
      bolts: Bolts.create(rawRoute.bolts),
      rating: Rating.create(rawRoute.stars),
      quality: Quality.create(rawRoute.quality),
      ascents: Ascents.create(rawRoute.ascents),
      routeType: RouteType.create(rawRoute.subType),
      firstAscent: FirstAscent.create(rawRoute.firstAscent),
      tags: Tags.create(rawRoute.tags),
      warnings: Warnings.create(rawRoute.warnings),
      topoNumber: TopoNumber.create(topoNumber),
    }
  }

  /**
   * Create CragEntity from validated data
   */
  createCragEntity(data: ValidatedCragData): CragEntity {
    return new CragEntity(
      data.id,
      data.externalId,
      data.countryId,
      data.regionId,
      data.name,
      data.altNames,
      data.geometry,
      data.locatedness,
      data.seasonality,
      data.beta,
      data.numberPhotos,
      data.numberTopos,
      data.hasTopo,
      data.totalFavorites,
      data.kudos,
      data.ascentCount,
      data.maxPop,
      data.priceCategory,
      data.permitNode,
      data.tagsRaw,
      data.sourceUrl,
      data.urlStub,
      data.urlAncestorStub,
      data.lastPDFSize,
      data.lastPDFStaticDate,
      undefined, // createdAt
      undefined, // updatedAt
      data.headerImageUrl,
      null, // headerImageWidth - no guardamos dimensiones
      null, // headerImageHeight - no guardamos dimensiones
    )
  }

  /**
   * Create AreaEntity from validated data
   */
  createAreaEntity(data: ValidatedAreaData): AreaEntity {
    return new AreaEntity(
      data.id,
      data.externalId,
      data.cragId,
      data.parentAreaId,
      data.name,
      data.altNames,
      data.type,
      data.geometry,
      data.seasonality,
      data.beta,
    )
  }

  /**
   * Create SectorEntity from validated data
   */
  createSectorEntity(data: ValidatedSectorData): SectorEntity {
    return new SectorEntity(
      data.id,
      data.externalId,
      data.areaId,
      data.name,
      data.altNames,
      data.type,
      data.geometry,
      data.locatedness,
      data.orientation,
      data.rockType,
      data.climbingStyle,
      data.sunExposure,
      data.sheltered,
      data.seasonality,
      data.beta,
      data.stats,
      data.numberPhotos,
      data.numberTopos,
      data.totalFavorites,
      data.isTLC,
      data.ascentCount,
      data.maxPop,
      data.priceCategory,
      data.hasTopo,
      data.kudos,
      data.permitNode,
      data.siblingLabel,
      data.tagsRaw,
      data.urlStub,
      data.urlAncestorStub,
      data.lastPDFSize,
      data.lastPDFStaticDate,
      undefined, // createdAt
      undefined, // updatedAt
      data.headerImageUrl,
      null, // headerImageWidth - no guardamos dimensiones
      null, // headerImageHeight - no guardamos dimensiones
    )
  }

  /**
   * Create RouteEntity from validated data
   */
  createRouteEntity(data: ValidatedRouteData): RouteEntity {
    return new RouteEntity(
      data.id,
      data.externalId,
      data.sectorId,
      data.name,
      data.grade,
      data.height,
      data.pitches,
      data.bolts,
      data.rating,
      data.quality,
      data.ascents,
      data.routeType,
      data.firstAscent,
      data.tags,
      data.warnings,
      data.topoNumber,
    )
  }

  // --- Private validation methods ---

  private validateAreaType(type: string | null | undefined): AreaType {
    if (type === 'Cliff') return 'Cliff'
    return 'Area'
  }

  private validateSectorType(type: string | null | undefined): SectorType {
    if (type === 'Cliff') return 'Cliff'
    return 'Sector'
  }
}
