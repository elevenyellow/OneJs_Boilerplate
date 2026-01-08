import { EntityId } from '@climb-zone/shared'

/**
 * Value Object for Crag entity identifier
 */
export class CragId extends EntityId {
  private constructor(value: string) {
    super(value)
  }

  static generate(): CragId {
    return new CragId(EntityId.generateUuid())
  }

  static fromString(id: string): CragId {
    if (!EntityId.isValidUuid(id) && !EntityId.isValidCuid(id)) {
      throw new Error(`Invalid CragId format: ${id}`)
    }
    return new CragId(id)
  }
}
