import { EntityId } from '@climb-zone/shared'

/**
 * Value Object for Area entity identifier
 */
export class AreaId extends EntityId {
  private constructor(value: string) {
    super(value)
  }

  static generate(): AreaId {
    return new AreaId(EntityId.generateUuid())
  }

  static fromString(id: string): AreaId {
    if (!EntityId.isValidUuid(id) && !EntityId.isValidCuid(id)) {
      throw new Error(`Invalid AreaId format: ${id}`)
    }
    return new AreaId(id)
  }
}
