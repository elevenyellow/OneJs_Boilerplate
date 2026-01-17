import { BaseId } from '@shared/domain/value-objects'

/**
 * Zone-specific UUID identifier.
 * Extends BaseId to inherit common UUID functionality.
 */
export class ZoneId extends BaseId<ZoneId> {
  private constructor(value: string) {
    super(value)
  }

  protected createInstance(value: string): ZoneId {
    return new ZoneId(value)
  }

  static generate(): ZoneId {
    return new ZoneId(BaseId.generateUuid())
  }

  static create(value: string): ZoneId {
    if (!value || value.trim().length === 0) {
      throw new Error('ZoneId cannot be empty')
    }
    return new ZoneId(value)
  }
}
