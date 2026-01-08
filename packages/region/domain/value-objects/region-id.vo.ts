import { EntityId } from '@climb-zone/shared'

/**
 * Region ID Value Object
 * Wraps the region's UUID identifier
 */
export class RegionId extends EntityId {
  private constructor(value: string) {
    super(value)
  }

  static generate(): RegionId {
    // @ts-ignore - accessing protected method
    return new RegionId(EntityId.generateUuid())
  }

  static fromString(value: string): RegionId {
    // Basic validation - accept both UUID and CUID formats
    if (!value || value.trim().length === 0) {
      throw new Error('RegionId cannot be empty')
    }
    return new RegionId(value)
  }
}
