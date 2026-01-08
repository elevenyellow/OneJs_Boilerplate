import { EntityId } from '@climb-zone/shared'

/**
 * Value Object for Sector entity identifier
 */
export class SectorId extends EntityId {
  private constructor(value: string) {
    super(value)
  }

  static generate(): SectorId {
    return new SectorId(EntityId.generateUuid())
  }

  static fromString(id: string): SectorId {
    if (!EntityId.isValidUuid(id) && !EntityId.isValidCuid(id)) {
      throw new Error(`Invalid SectorId format: ${id}`)
    }
    return new SectorId(id)
  }
}
