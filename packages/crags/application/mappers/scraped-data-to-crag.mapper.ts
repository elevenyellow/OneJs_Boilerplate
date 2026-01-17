import { Inject, Injectable } from '@OneJs/core'
import type { ScrapedCrag } from '@the-crag/infrastructure/scraper/api.interfaces'
import type { CragCreateDto } from '../../domain/dtos'
import { Crag } from '../../domain/entities/crag.entity'
import { ExternalId, Id } from '../../domain/value-objects'
import { CragPrismaRepository } from '../../infrastructure/persistence/prisma/crag.repository'
import { ZoneId } from '@zones/domain/value-objects'

@Injectable()
export class ScrapedDataToCragMapper {
  constructor(
    @Inject(CragPrismaRepository)
    private readonly cragRepository: CragPrismaRepository,
  ) {}

  async mapFromScrapedData(data: ScrapedCrag, zoneId: ZoneId): Promise<Crag> {
    const externalId = ExternalId.createFrom(data.id)
    const existingCrag = await this.cragRepository.findByExternalId(externalId)

    if (existingCrag) {
      return this.mergeWithExisting(existingCrag, data, zoneId)
    }

    return this.createNew(data, zoneId)
  }

  private createNew(data: ScrapedCrag, zoneId: ZoneId): Crag {
    const info = data.info
    const hasSectors = (data.areas?.length ?? 0) > 0

    const dto: CragCreateDto = {
      id: Id.generateUniqueId().getValue(),
      externalId: data.id,
      zoneId: zoneId.toString(),
      name: info.name,
      asciiName: info.asciiName || info.name,
      type: info.type || data.type,
      subType: info.subType || 'unknown',
      urlStub: info.urlStub || null,
      urlAncestorStub: info.urlAncestorStub || null,
      headerImage: data.headerImage || null,
      latitude: info.geometry?.lat || null,
      longitude: info.geometry?.long || null,
      areaSize: info.geometry?.areasize || null,
      geometry: info.geometry || null,
      numberRoutes: info.numberRoutes || null,
      numberPhotos: info.numberPhotos || null,
      numberTopos: info.numberTopos || null,
      ascentCount: info.ascentCount || null,
      kudos: info.kudos || info.totalFavorites || null, // Merge totalFavorites into kudos
      averageHeight: (info.averageHeight?.[0] as number) || null,
      averageHeightUnit: info.averageHeight?.[1] || null,
      gbRoutes: data.gbRoutes || null,
      beta: info.beta || null,
      styles: info.styles || null,
      tags: info.tags || null,
      altNames: info.altNames || null,
      seasonality: info.seasonality || null,
      hasTopo: (info.hasTopo ?? 0) > 0,
      hasSectors: hasSectors,
    }

    return Crag.create(dto)
  }

  private mergeWithExisting(
    existing: Crag,
    data: ScrapedCrag,
    zoneId: ZoneId,
  ): Crag {
    const existingDto = existing.toPrimitives()
    const info = data.info
    const hasSectors = (data.areas?.length ?? 0) > 0

    const mergedDto: CragCreateDto = {
      id: existingDto.id,
      externalId: existingDto.externalId,
      zoneId: existingDto.zoneId || zoneId.toString(),
      name: this.mergeValue(existingDto.name, info.name) ?? '',
      asciiName: this.mergeValue(
        existingDto.asciiName,
        info.asciiName || info.name,
      ),
      type: this.mergeValue(existingDto.type, info.type || data.type) ?? '',
      subType:
        this.mergeValue(existingDto.subType, info.subType || 'unknown') ?? '',
      urlStub: this.mergeValue(existingDto.urlStub, info.urlStub),
      urlAncestorStub: this.mergeValue(
        existingDto.urlAncestorStub,
        info.urlAncestorStub,
      ),
      headerImage: this.mergeValue(existingDto.headerImage, data.headerImage),
      latitude: this.mergeValue(existingDto.latitude, info.geometry?.lat),
      longitude: this.mergeValue(existingDto.longitude, info.geometry?.long),
      areaSize: this.mergeValue(existingDto.areaSize, info.geometry?.areasize),
      geometry: this.mergeValue(existingDto.geometry, info.geometry),
      numberRoutes: this.mergeValue(
        existingDto.numberRoutes,
        info.numberRoutes,
      ),
      numberPhotos: this.mergeValue(
        existingDto.numberPhotos,
        info.numberPhotos,
      ),
      numberTopos: this.mergeValue(existingDto.numberTopos, info.numberTopos),
      ascentCount: this.mergeValue(existingDto.ascentCount, info.ascentCount),
      kudos: this.mergeValue(
        existingDto.kudos,
        info.kudos ?? info.totalFavorites,
      ),
      averageHeight: this.mergeValue(
        existingDto.averageHeight,
        info.averageHeight?.[0] as number,
      ),
      averageHeightUnit: this.mergeValue(
        existingDto.averageHeightUnit,
        info.averageHeight?.[1],
      ),
      gbRoutes: this.mergeArray(existingDto.gbRoutes, data.gbRoutes),
      beta: this.mergeArray(existingDto.beta, info.beta),
      styles: this.mergeArray(existingDto.styles, info.styles),
      tags: this.mergeValue(existingDto.tags, info.tags),
      altNames: this.mergeArray(existingDto.altNames, info.altNames),
      seasonality: this.mergeArray(existingDto.seasonality, info.seasonality),
      hasTopo: existingDto.hasTopo || (info.hasTopo ?? 0) > 0,
      hasSectors: existingDto.hasSectors || hasSectors,
      createdAt: existingDto.createdAt,
      updatedAt: new Date(),
    }

    return Crag.create(mergedDto)
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
