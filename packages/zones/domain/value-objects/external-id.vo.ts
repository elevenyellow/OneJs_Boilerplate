import { BaseExternalId } from '@shared/domain/value-objects'

/**
 * Zone-specific external identifier (e.g., from TheCrag).
 * Extends BaseExternalId to inherit common functionality.
 */
export class ZoneExternalId extends BaseExternalId<ZoneExternalId> {
  private constructor(value: string) {
    super(value)
  }

  protected createInstance(value: string): ZoneExternalId {
    return new ZoneExternalId(value)
  }

  static create(value: string | number): ZoneExternalId {
    if (value === null || value === undefined) {
      throw new Error('ZoneExternalId cannot be null')
    }
    return new ZoneExternalId(String(value))
  }
}
