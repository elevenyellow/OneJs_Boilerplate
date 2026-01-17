import { Inject, Injectable } from '@OneJs/core'
import type { ProcessedArea } from '@the-crag/infrastructure/scraper/api.interfaces'
import type { SectorCreateDto } from '../../domain/dtos'
import { Sector } from '../../domain/entities/sector.entity'
import {
  ExternalId,
  Id,
  SectorTags,
  type TagsData,
} from '../../domain/value-objects'
import { SectorPrismaRepository } from '../../infrastructure/persistence/prisma/sector.repository'
import { Id as CragId } from '@crags/domain/value-objects'

@Injectable()
export class ScrapedDataToSectorMapper {
  constructor(
    @Inject(SectorPrismaRepository)
    private readonly sectorRepository: SectorPrismaRepository,
  ) {}

  async mapFromScrapedData(
    data: ProcessedArea,
    cragId: CragId,
    parentId: Id | null,
    externalParentId: ExternalId | null,
  ): Promise<Sector> {
    const externalId = ExternalId.createFrom(data.id)
    const existingSector =
      await this.sectorRepository.findByExternalId(externalId)

    if (existingSector) {
      return this.mergeWithExisting(
        existingSector,
        data,
        cragId,
        parentId,
        externalParentId,
      )
    }

    return this.createNew(data, cragId, parentId, externalParentId)
  }

  private createNew(
    data: ProcessedArea,
    cragId: CragId,
    parentId: Id | null,
    externalParentId: ExternalId | null,
  ): Sector {
    const hasSubSectors = (data.subAreas?.length ?? 0) > 0

    // Parse tags to extract atomic values
    const parsedTags = SectorTags.createFrom(data.tags as TagsData | null)

    const dto: SectorCreateDto = {
      id: Id.generateUniqueId().getValue(),
      externalId: data.id,
      name: data.name,
      asciiName: data.asciiName || data.name,
      type: data.type,
      subType: data.subType,
      urlStub: data.urlStub || null,
      urlAncestorStub: data.urlAncestorStub || null,
      headerImage: data.headerImage || null,
      coverImage: data.coverImage || null,
      thumbnail: data.thumbnail || null,
      approach: data.approach || null,
      latitude: data.geometry?.lat ?? data.lat ?? null,
      longitude: data.geometry?.long ?? data.lng ?? null,
      geometry: data.geometry || null,
      depth: data.depth,
      parentId: parentId?.toString() || null,
      cragId: cragId.toString(),
      externalParentId: externalParentId?.toString() || null,
      numberRoutes: data.numberRoutes ?? null,
      numberPhotos: data.numberPhotos ?? null,
      numberTopos: data.numberTopos ?? null,
      ascentCount: data.ascentCount ?? null,
      kudos: data.kudos ?? data.totalFavorites ?? null, // Merge totalFavorites into kudos
      maxPop: data.maxPop ?? null,
      subAreaCount: data.subAreaCount ?? null,
      averageHeight: (data.averageHeight?.[0] as number) ?? null,
      averageHeightUnit: data.averageHeight?.[1] || null,
      seasonality: data.seasonality || null,
      tags: data.tags as TagsData | null,
      tagAspect: parsedTags.getAspect(),
      tagWalkInTime: parsedTags.getWalkInTime(),
      tagFamily: parsedTags.getFamily(),
      tagWeather: parsedTags.getWeather(),
      tagCrowds: parsedTags.getCrowds(),
      tagStyle: parsedTags.getStyle(),
      beta: data.beta || null,
      styles: data.styles || null,
      altNames: data.altNames || null,
      gbRoutes: data.gbRoutes || null,
      hasTopo: (data.hasTopo ?? 0) > 0,
      hasSubSectors: hasSubSectors,
    }

    return Sector.create(dto)
  }

  private mergeWithExisting(
    existing: Sector,
    data: ProcessedArea,
    cragId: CragId,
    parentId: Id | null,
    externalParentId: ExternalId | null,
  ): Sector {
    const existingDto = existing.toPrimitives()
    const hasSubSectors = (data.subAreas?.length ?? 0) > 0

    // Parse new tags and merge with existing
    const mergedTagsData = this.mergeValue(
      existingDto.tags,
      data.tags as TagsData | null,
    )
    const parsedTags = SectorTags.createFrom(mergedTagsData)

    const mergedDto: SectorCreateDto = {
      id: existingDto.id,
      externalId: existingDto.externalId,
      name: this.mergeValue(existingDto.name, data.name) ?? '',
      asciiName: this.mergeValue(
        existingDto.asciiName,
        data.asciiName || data.name,
      ),
      type: this.mergeValue(existingDto.type, data.type) ?? '',
      subType: this.mergeValue(existingDto.subType, data.subType) ?? '',
      urlStub: this.mergeValue(existingDto.urlStub, data.urlStub),
      urlAncestorStub: this.mergeValue(
        existingDto.urlAncestorStub,
        data.urlAncestorStub,
      ),
      headerImage: this.mergeValue(existingDto.headerImage, data.headerImage),
      coverImage: this.mergeValue(existingDto.coverImage, data.coverImage),
      thumbnail: this.mergeValue(existingDto.thumbnail, data.thumbnail),
      approach: this.mergeValue(existingDto.approach, data.approach),
      latitude: this.mergeValue(
        existingDto.latitude,
        data.geometry?.lat ?? data.lat,
      ),
      longitude: this.mergeValue(
        existingDto.longitude,
        data.geometry?.long ?? data.lng,
      ),
      geometry: this.mergeValue(existingDto.geometry, data.geometry),
      depth: existingDto.depth ?? data.depth,
      parentId: this.mergeValue(existingDto.parentId, parentId?.toString()),
      cragId: existingDto.cragId || cragId.toString(),
      externalParentId: this.mergeValue(
        existingDto.externalParentId,
        externalParentId?.toString(),
      ),
      numberRoutes: this.mergeValue(
        existingDto.numberRoutes,
        data.numberRoutes,
      ),
      numberPhotos: this.mergeValue(
        existingDto.numberPhotos,
        data.numberPhotos,
      ),
      numberTopos: this.mergeValue(existingDto.numberTopos, data.numberTopos),
      ascentCount: this.mergeValue(existingDto.ascentCount, data.ascentCount),
      kudos: this.mergeValue(
        existingDto.kudos,
        data.kudos ?? data.totalFavorites,
      ),
      maxPop: this.mergeValue(existingDto.maxPop, data.maxPop),
      subAreaCount: this.mergeValue(
        existingDto.subAreaCount,
        data.subAreaCount,
      ),
      averageHeight: this.mergeValue(
        existingDto.averageHeight,
        data.averageHeight?.[0] as number,
      ),
      averageHeightUnit: this.mergeValue(
        existingDto.averageHeightUnit,
        data.averageHeight?.[1],
      ),
      seasonality: this.mergeArray(existingDto.seasonality, data.seasonality),
      tags: mergedTagsData,
      tagAspect: parsedTags.getAspect(),
      tagWalkInTime: parsedTags.getWalkInTime(),
      tagFamily: parsedTags.getFamily(),
      tagWeather: parsedTags.getWeather(),
      tagCrowds: parsedTags.getCrowds(),
      tagStyle: parsedTags.getStyle(),
      beta: this.mergeArray(existingDto.beta, data.beta),
      styles: this.mergeArray(existingDto.styles, data.styles),
      altNames: this.mergeArray(existingDto.altNames, data.altNames),
      gbRoutes: this.mergeArray(existingDto.gbRoutes, data.gbRoutes),
      hasTopo: existingDto.hasTopo || (data.hasTopo ?? 0) > 0,
      hasSubSectors: existingDto.hasSubSectors || hasSubSectors,
      createdAt: existingDto.createdAt,
      updatedAt: new Date(),
    }

    return Sector.create(mergedDto)
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

  private mergeArray<T>(
    existing: T[] | null | undefined,
    scraped: T[] | null | undefined,
  ): T[] | null {
    if (!existing || existing.length === 0) {
      return scraped || null
    }
    return existing
  }
}
