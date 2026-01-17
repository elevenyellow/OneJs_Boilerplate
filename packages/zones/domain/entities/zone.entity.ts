import type { CreateZoneInput, ZoneDto } from '../dtos'
import {
  ZoneAsciiName,
  ZoneDepth,
  ZoneExternalId,
  ZoneHref,
  ZoneId,
  ZoneName,
  ZonePosition,
  ZoneType,
  ZoneUrlAncestorStub,
  ZoneUrlStub,
} from '../value-objects'

export class Zone {
  private constructor(
    private readonly id: ZoneId,
    private readonly externalId: ZoneExternalId,
    private readonly name: ZoneName,
    private readonly asciiName: ZoneAsciiName,
    private readonly type: ZoneType,
    private readonly urlStub: ZoneUrlStub,
    private readonly urlAncestorStub: ZoneUrlAncestorStub,
    private readonly parentId: ZoneId | null,
    private readonly depth: ZoneDepth,
    private readonly href: ZoneHref,
    private readonly position: ZonePosition,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  static create(input: CreateZoneInput): Zone {
    return new Zone(
      ZoneId.generate(),
      ZoneExternalId.create(input.externalId),
      ZoneName.create(input.name),
      ZoneAsciiName.create(input.asciiName),
      ZoneType.create(input.type || 'unknown'),
      ZoneUrlStub.create(input.urlStub),
      ZoneUrlAncestorStub.create(input.urlAncestorStub),
      input.parentId ? ZoneId.create(input.parentId) : null,
      ZoneDepth.create(input.depth),
      ZoneHref.create(input.href),
      ZonePosition.create(input.position),
      new Date(),
      new Date(),
    )
  }

  static fromDatabase(data: ZoneDto): Zone {
    return new Zone(
      ZoneId.create(data.id),
      ZoneExternalId.create(data.externalId),
      ZoneName.create(data.name),
      ZoneAsciiName.create(data.asciiName),
      ZoneType.create(data.type),
      ZoneUrlStub.create(data.urlStub),
      ZoneUrlAncestorStub.create(data.urlAncestorStub),
      data.parentId ? ZoneId.create(data.parentId) : null,
      ZoneDepth.create(data.depth),
      ZoneHref.create(data.href),
      ZonePosition.create(data.position),
      data.createdAt,
      data.updatedAt,
    )
  }

  getId(): ZoneId {
    return this.id
  }

  getExternalId(): ZoneExternalId {
    return this.externalId
  }

  getName(): ZoneName {
    return this.name
  }

  getAsciiName(): ZoneAsciiName {
    return this.asciiName
  }

  getType(): ZoneType {
    return this.type
  }

  getUrlStub(): ZoneUrlStub {
    return this.urlStub
  }

  getUrlAncestorStub(): ZoneUrlAncestorStub {
    return this.urlAncestorStub
  }

  getParentId(): ZoneId | null {
    return this.parentId
  }

  getDepth(): ZoneDepth {
    return this.depth
  }

  getHref(): ZoneHref {
    return this.href
  }

  getPosition(): ZonePosition {
    return this.position
  }

  toDto(): ZoneDto {
    return {
      id: this.id.toString(),
      externalId: this.externalId.toString(),
      name: this.name.toString(),
      asciiName: this.asciiName.toString(),
      type: this.type.toString(),
      urlStub: this.urlStub.toString(),
      urlAncestorStub: this.urlAncestorStub.toString(),
      parentId: this.parentId?.toString() || null,
      depth: this.depth.getValue(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      href: this.href.toString(),
      position: this.position.getValue(),
    }
  }
}
