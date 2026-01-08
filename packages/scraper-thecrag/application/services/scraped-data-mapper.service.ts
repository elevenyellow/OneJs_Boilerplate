import { Injectable } from '@OneJs/core'
import { AreaId } from '@area/domain/value-objects/area-id.vo'
import { AreaEntity, type AreaType } from '@climb-zone/area'
import { CountryId, CragEntity } from '@climb-zone/crag'
import { RegionId } from '@climb-zone/region'
import { RouteEntity } from '@climb-zone/route'
import { SectorEntity, type SectorType } from '@climb-zone/sector'
import type { GeometryData } from '@climb-zone/shared'
import {
  BetaInfo,
  ExternalId,
  Geometry,
  Grade,
  Name,
  Seasonality,
  Url,
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
  geometry: Geometry | null
  seasonality: Seasonality
  beta: BetaInfo
  sourceUrl: Url
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
  type: AreaType
  geometry: Geometry | null
  beta: BetaInfo
}

/**
 * Validated data for creating a Sector entity
 */
export interface ValidatedSectorData {
  id: SectorId
  externalId: ExternalId
  areaId: AreaId
  name: Name
  type: SectorType
  geometry: Geometry | null
  seasonality: Seasonality
  beta: BetaInfo
  stats: SectorStats
  priceCategory: PriceCategory | null
  hasTopo: boolean
  kudos: Kudos | null
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

    return {
      id: CragId.generate(),
      externalId,
      countryId,
      regionId,
      name,
      geometry,
      seasonality,
      beta,
      sourceUrl,
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

    return {
      id: AreaId.generate(),
      externalId,
      cragId,
      parentAreaId,
      name,
      type,
      geometry,
      beta,
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

    return {
      id: SectorId.generate(),
      externalId,
      areaId,
      name,
      type,
      geometry,
      seasonality,
      beta,
      stats: SectorStats.empty(),
      priceCategory,
      hasTopo: Boolean(info?.hasTopo),
      kudos,
    }
  }

  /**
   * Map scraped route data to validated Route data
   */
  mapToRoute(
    rawRoute: ScrapedRouteData,
    sectorId: SectorId,
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
      data.geometry,
      data.seasonality,
      data.beta,
      data.sourceUrl,
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
      data.type,
      data.geometry,
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
      data.type,
      data.geometry,
      data.seasonality,
      data.beta,
      data.stats,
      data.priceCategory,
      data.hasTopo,
      data.kudos,
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
