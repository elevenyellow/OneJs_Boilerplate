import { Inject, Injectable } from '@OneJs/core'
import type { ScrapedRoute } from '@the-crag/infrastructure/scraper/api.interfaces'
import type { RouteCreateDto } from '../../domain/dtos'
import { Route } from '../../domain/entities/route.entity'
import {
  ExternalId,
  Id,
  type StyleFlagsData,
  type TagsData,
  type WarningsData,
} from '../../domain/value-objects'
import { RoutePrismaRepository } from '../../infrastructure/persistence/prisma/route.repository'
import { Id as CragId } from '@crags/domain/value-objects'
import { Id as SectorId } from '@sectors/domain/value-objects'
import { calculateGradeIndexOrZero } from '@grades/domain/services/grade-index-calculator'

@Injectable()
export class ScrapedDataToRouteMapper {
  constructor(
    @Inject(RoutePrismaRepository)
    private readonly routeRepository: RoutePrismaRepository,
  ) {}

  async mapFromScrapedData(
    data: ScrapedRoute,
    cragId: CragId,
    sectorId: SectorId | null,
  ): Promise<Route> {
    const externalId = ExternalId.createFrom(data.id)
    const existingRoute =
      await this.routeRepository.findByExternalId(externalId)

    if (existingRoute) {
      return this.mergeWithExisting(existingRoute, data, cragId, sectorId)
    }

    return this.createNew(data, cragId, sectorId)
  }

  private createNew(
    data: ScrapedRoute,
    cragId: CragId,
    sectorId: SectorId | null,
  ): Route {
    const dto = this.buildDto(
      Id.generateUniqueId().getValue(),
      data,
      cragId,
      sectorId,
    )
    return Route.create(dto)
  }

  private mergeWithExisting(
    existing: Route,
    data: ScrapedRoute,
    cragId: CragId,
    sectorId: SectorId | null,
  ): Route {
    const existingDto = existing.toPrimitives()
    const scrapedDto = this.buildDto(existingDto.id, data, cragId, sectorId)

    const mergedDto: RouteCreateDto = {
      id: existingDto.id,
      externalId: existingDto.externalId,
      name: this.mergeValue(existingDto.name, scrapedDto.name) ?? '',
      urlAncestorStub: this.mergeValue(
        existingDto.urlAncestorStub,
        scrapedDto.urlAncestorStub,
      ),
      grade: this.mergeValue(existingDto.grade, scrapedDto.grade),
      gradeBand: existingDto.gradeBand ?? scrapedDto.gradeBand,
      gradeStyle: this.mergeValue(
        existingDto.gradeStyle,
        scrapedDto.gradeStyle,
      ),
      gradeInContext: this.mergeValue(
        existingDto.gradeInContext,
        scrapedDto.gradeInContext,
      ),
      rawGradeMin: this.mergeValue(
        existingDto.rawGradeMin,
        scrapedDto.rawGradeMin,
      ),
      rawGradeMax: this.mergeValue(
        existingDto.rawGradeMax,
        scrapedDto.rawGradeMax,
      ),
      height: this.mergeValue(existingDto.height, scrapedDto.height),
      heightUnit: this.mergeValue(
        existingDto.heightUnit,
        scrapedDto.heightUnit,
      ),
      pitches: this.mergeValue(existingDto.pitches, scrapedDto.pitches),
      stars: this.mergeValue(existingDto.stars, scrapedDto.stars),
      ascents: this.mergeValue(existingDto.ascents, scrapedDto.ascents),
      popularity: this.mergeValue(
        existingDto.popularity,
        scrapedDto.popularity,
      ),
      style: this.mergeValue(existingDto.style, scrapedDto.style),
      bolts: this.mergeValue(existingDto.bolts, scrapedDto.bolts),
      // Style flags - prefer existing numeric value, fallback to scraped data
      styleFlags: existingDto.styleFlags,
      styleFlagsData: scrapedDto.styleFlagsData,
      // First Ascent & Equipment
      firstAscent: this.mergeValue(
        existingDto.firstAscent,
        scrapedDto.firstAscent,
      ),
      equipper: this.mergeValue(existingDto.equipper, scrapedDto.equipper),
      equipDate: this.mergeValue(existingDto.equipDate, scrapedDto.equipDate),
      maintainer: this.mergeValue(
        existingDto.maintainer,
        scrapedDto.maintainer,
      ),
      maintDate: this.mergeValue(existingDto.maintDate, scrapedDto.maintDate),
      // Description
      description: this.mergeValue(
        existingDto.description,
        scrapedDto.description,
      ),
      descriptionHtml: this.mergeValue(
        existingDto.descriptionHtml,
        scrapedDto.descriptionHtml,
      ),
      // Status
      isClosed: scrapedDto.isClosed ?? existingDto.isClosed ?? false,
      hasWarning: scrapedDto.hasWarning ?? existingDto.hasWarning ?? false,
      warningText: this.mergeValue(
        existingDto.warningText,
        scrapedDto.warningText,
      ),
      // Topo
      hasTopo: scrapedDto.hasTopo ?? existingDto.hasTopo ?? false,
      topoNumber: this.mergeValue(
        existingDto.topoNumber,
        scrapedDto.topoNumber,
      ),
      // Hierarchy
      siblingLabel: this.mergeValue(
        existingDto.siblingLabel,
        scrapedDto.siblingLabel,
      ),
      depth: this.mergeValue(existingDto.depth, scrapedDto.depth),
      sectorId: this.mergeValue(existingDto.sectorId, sectorId?.toString()),
      cragId: existingDto.cragId || cragId.toString(),
      externalParentId: this.mergeValue(
        existingDto.externalParentId,
        scrapedDto.externalParentId,
      ),
      // Metadata
      tags: this.mergeValue(existingDto.tags, scrapedDto.tags),
      warnings: this.mergeValue(existingDto.warnings, scrapedDto.warnings),
      akaNames: this.mergeAkaNames(existingDto.akaNames, scrapedDto.akaNames),
      createdAt: existingDto.createdAt,
      updatedAt: new Date(),
    }

    return Route.create(mergedDto)
  }

  private buildDto(
    id: string,
    data: ScrapedRoute,
    cragId: CragId,
    sectorId: SectorId | null,
  ): RouteCreateDto {
    // Convert height from HeightTuple to number (handle string or number)
    const heightValue = data.height
      ? typeof data.height[0] === 'string'
        ? Number.parseFloat(data.height[0])
        : data.height[0]
      : null
    const heightNumber =
      heightValue !== null && !Number.isNaN(heightValue) ? heightValue : null

    return {
      id: id,
      externalId: data.id,
      name: data.name,
      urlAncestorStub: data.urlAncestorStub || null,
      // Grade - Use universal grade index instead of TheCrag's gradeBand
      grade: data.grade || null,
      gradeBand: this.calculateUniversalGradeIndex(data),
      gradeStyle: data.gradeStyle || null,
      gradeInContext: data.gradeInContext || null,
      rawGradeMin: data.rawGrade?.[0] ?? null,
      rawGradeMax: data.rawGrade?.[1] ?? null,
      // Dimensions
      height: heightNumber,
      heightUnit: data.height?.[1] || null,
      pitches: data.pitches || null,
      // Quality
      stars: data.stars || null,
      // Popularity - consolidate ascentCount into ascents (prefer ascentCount)
      ascents: data.ascentCount || data.ascents || null,
      popularity: data.popularity || null,
      // Style & Equipment
      style: data.style || null,
      bolts: data.bolts || null,
      // Style flags from scraped data (bitmask will be computed from this)
      styleFlagsData: (data.flags as StyleFlagsData) || null,
      // First Ascent & Equipment (from HTML)
      firstAscent: data.firstAscent || null,
      equipper: data.equipper || null,
      equipDate: data.equipDate || null,
      maintainer: data.maintainer || null,
      maintDate: data.maintDate || null,
      // Description
      description: data.description || null,
      descriptionHtml: data.descriptionHtml || null,
      // Status (from HTML)
      isClosed: data.isClosed,
      hasWarning: data.hasWarning,
      warningText: data.warningText || null,
      // Topo (from HTML)
      hasTopo: data.hasTopoHtml,
      topoNumber: data.topoNumber || null,
      // Hierarchy
      siblingLabel: data.siblingLabel || null,
      depth: data.depth || null,
      sectorId: sectorId?.toString() || null,
      cragId: cragId.toString(),
      externalParentId: data.parentID?.toString() || null,
      // Metadata
      tags: data.tags as TagsData | null,
      warnings: data.warnings as WarningsData | null,
      akaNames: data.akaNames.length > 0 ? data.akaNames : null,
    }
  }

  private mergeValue<T>(
    existing: T | null | undefined,
    scraped: T | null | undefined,
  ): T | null {
    if (existing === null || existing === undefined || existing === '') {
      return (scraped ?? null) as T | null
    }
    return existing as T | null
  }

  private mergeAkaNames(
    existing: string[] | null | undefined,
    scraped: string[] | null | undefined,
  ): string[] | null {
    const existingNames = existing ?? []
    const scrapedNames = scraped ?? []
    const combined = [...new Set([...existingNames, ...scrapedNames])]
    return combined.length > 0 ? combined : null
  }

  /**
   * Calculate the universal grade index from scraped route data
   *
   * @param data - Scraped route data containing grade string
   * @returns Universal grade index, or 0 if grade cannot be determined
   */
  private calculateUniversalGradeIndex(data: ScrapedRoute): number {
    return calculateGradeIndexOrZero(data.grade)
  }
}
