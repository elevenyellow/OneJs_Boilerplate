import { Inject, Injectable } from '@OneJs/core'
import { PrismaClientOneJs } from '@OneJs/prisma'
import type { ZoneDto } from '../../../domain/dtos'
import { Zone } from '../../../domain/entities/zone.entity'
import { ZoneExternalId, ZoneId, ZoneType } from '../../../domain/value-objects'

@Injectable()
export class ZonePrismaRepository {
  constructor(
    @Inject(PrismaClientOneJs)
    private readonly prisma: PrismaClientOneJs,
  ) {}

  async findById(id: ZoneId): Promise<Zone | null> {
    const zone = await this.prisma.zone.findUnique({
      where: { id: id.toString() },
    })

    if (!zone) return null

    return Zone.fromDatabase(zone as ZoneDto)
  }

  async findByExternalId(externalId: ZoneExternalId): Promise<Zone | null> {
    const zone = await this.prisma.zone.findUnique({
      where: { externalId: externalId.toString() },
    })

    if (!zone) return null

    return Zone.fromDatabase(zone as ZoneDto)
  }

  async findByExternalIds(externalIds: ZoneExternalId[]): Promise<Zone[]> {
    if (externalIds.length === 0) return []

    const zones = await this.prisma.zone.findMany({
      where: { externalId: { in: externalIds.map((id) => id.toString()) } },
    })

    return zones.map((z) => Zone.fromDatabase(z as ZoneDto))
  }

  async findChildren(parentId: ZoneId): Promise<Zone[]> {
    const zones = await this.prisma.zone.findMany({
      where: { parentId: parentId.toString() },
      orderBy: { name: 'asc' },
    })

    return zones.map((z) => Zone.fromDatabase(z as ZoneDto))
  }

  async findByType(type: ZoneType): Promise<Zone[]> {
    const zones = await this.prisma.zone.findMany({
      where: { type: type.toString() },
      orderBy: { name: 'asc' },
    })

    return zones.map((z) => Zone.fromDatabase(z as ZoneDto))
  }

  async save(zone: Zone): Promise<Zone> {
    const dto = zone.toDto()

    const saved = await this.prisma.zone.upsert({
      where: { externalId: dto.externalId },
      create: {
        id: dto.id,
        externalId: dto.externalId,
        name: dto.name,
        asciiName: dto.asciiName,
        type: dto.type,
        urlStub: dto.urlStub,
        urlAncestorStub: dto.urlAncestorStub,
        parentId: dto.parentId,
        depth: dto.depth,
        href: dto.href,
        position: dto.position,
      },
      update: {
        name: dto.name,
        asciiName: dto.asciiName,
        type: dto.type,
        urlStub: dto.urlStub,
        urlAncestorStub: dto.urlAncestorStub,
        parentId: dto.parentId,
        depth: dto.depth,
        href: dto.href,
        position: dto.position,
      },
    })

    return Zone.fromDatabase(saved as ZoneDto)
  }

  async saveMany(zones: Zone[]): Promise<void> {
    if (zones.length === 0) return

    for (const zone of zones) {
      await this.save(zone)
    }
  }
}
