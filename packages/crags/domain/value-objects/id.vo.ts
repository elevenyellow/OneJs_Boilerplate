import { BaseId } from '@shared/domain/value-objects'

/**
 * Crag-specific UUID identifier.
 * Extends BaseId to inherit common UUID functionality.
 */
export class Id extends BaseId<Id> {
  private constructor(value: string) {
    super(value)
  }

  protected createInstance(value: string): Id {
    return new Id(value)
  }

  static generateUniqueId(): Id {
    return new Id(BaseId.generateUuid())
  }

  static createEmptyId(): Id {
    return new Id('')
  }

  static createFrom(id: string): Id {
    if (id === '') {
      return this.createEmptyId()
    }

    if (!BaseId.isValidUuid(id)) {
      throw new Error(`Invalid Id format, ${id} is not valid`)
    }
    return new Id(id)
  }
}
