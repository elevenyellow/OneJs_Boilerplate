import { EntityId } from '@climb-zone/shared'

/**
 * Value Object for Route entity identifier
 */
export class RouteId extends EntityId {
  private constructor(value: string) {
    super(value)
  }

  static generate(): RouteId {
    return new RouteId(EntityId.generateUuid())
  }

  static fromString(id: string): RouteId {
    if (!EntityId.isValidUuid(id) && !EntityId.isValidCuid(id)) {
      throw new Error(`Invalid RouteId format: ${id}`)
    }
    return new RouteId(id)
  }
}
