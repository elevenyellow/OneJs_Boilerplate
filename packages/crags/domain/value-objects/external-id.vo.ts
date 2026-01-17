import { BaseExternalId } from '@shared/domain/value-objects'

/**
 * Crag-specific external identifier (e.g., from TheCrag).
 * Extends BaseExternalId to inherit common functionality.
 */
export class ExternalId extends BaseExternalId<ExternalId> {
  private constructor(value: string) {
    super(value)
  }

  protected createInstance(value: string): ExternalId {
    return new ExternalId(value)
  }

  static createFrom(id: string | number): ExternalId {
    BaseExternalId.validateValue(id)
    return new ExternalId(String(id))
  }

  static createEmpty(): ExternalId {
    return new ExternalId('')
  }
}
