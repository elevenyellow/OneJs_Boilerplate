import { Inject, Injectable } from '@OneJs/core'
import type { ParentNode } from '@the-crag/infrastructure/scraper/api.interfaces'
import type { CreateZoneInput, ZoneDto } from '../../domain/dtos'
import { Zone } from '../../domain/entities/zone.entity'
import { ZoneExternalId, ZoneId } from '../../domain/value-objects'
import { ZonePrismaRepository } from '../../infrastructure/persistence/prisma/zone.repository'

@Injectable()
export class ScrapedDataToZoneMapper {
  constructor(
    @Inject(ZonePrismaRepository)
    private readonly zoneRepository: ZonePrismaRepository,
  ) {}

  async mapFromScrapedData(
    data: ParentNode,
    parentId: ZoneId | null,
  ): Promise<Zone> {
    const externalId = ZoneExternalId.create(data.id)
    const existingZone = await this.zoneRepository.findByExternalId(externalId)

    if (existingZone) {
      return this.mergeWithExisting(existingZone, data, parentId)
    }

    return this.createNew(data, parentId)
  }

  private createNew(data: ParentNode, parentId: ZoneId | null): Zone {
    const input: CreateZoneInput = {
      externalId: data.id,
      name: data.name,
      asciiName: data.name,
      type: data.type || 'unknown',
      urlStub: data.urlStub,
      urlAncestorStub: null,
      parentId: parentId?.toString() || null,
      depth: data.position,
      href: data.href,
      position: data.position,
    }

    return Zone.create(input)
  }

  private mergeWithExisting(
    existing: Zone,
    data: ParentNode,
    parentId: ZoneId | null,
  ): Zone {
    const existingDto = existing.toDto()

    const mergedDto: ZoneDto = {
      id: existingDto.id,
      externalId: existingDto.externalId,
      name: this.mergeValue(existingDto.name, data.name) ?? '',
      asciiName: this.mergeValue(existingDto.asciiName, data.name),
      type: this.mergeValue(existingDto.type, data.type || 'unknown') ?? '',
      urlStub: this.mergeValue(existingDto.urlStub, data.urlStub),
      urlAncestorStub: existingDto.urlAncestorStub,
      parentId: this.mergeValue(
        existingDto.parentId,
        parentId?.toString() || null,
      ),
      depth: existingDto.depth ?? data.position,
      href: this.mergeValue(existingDto.href, data.href),
      position: existingDto.position ?? data.position,
      createdAt: existingDto.createdAt,
      updatedAt: new Date(),
    }

    return Zone.fromDatabase(mergedDto)
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
}
