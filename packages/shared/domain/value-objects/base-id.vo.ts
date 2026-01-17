import { v4 as uuidv4 } from 'uuid'

/**
 * Base abstract class for UUID-based identifiers.
 * Each bounded context should extend this class for its own Id value object.
 *
 * @example
 * ```typescript
 * // packages/routes/domain/value-objects/id.vo.ts
 * import { BaseId } from '@shared/domain/value-objects'
 *
 * export class Id extends BaseId<Id> {
 *   protected createInstance(value: string): Id {
 *     return new Id(value)
 *   }
 * }
 * ```
 */
export abstract class BaseId<T extends BaseId<T>> {
  protected readonly value: string

  protected constructor(value: string) {
    this.value = value
  }

  /**
   * Create a new instance with the given value.
   * Subclasses must implement this to return their own type.
   */
  protected abstract createInstance(value: string): T

  /**
   * Generates a new unique UUID v4 identifier.
   * Available to subclasses for creating new IDs.
   */
  static generateUuid(): string {
    return uuidv4()
  }

  /**
   * Validates if a string is a valid UUID v4.
   * Available to subclasses for validation.
   */
  static isValidUuid(id: string): boolean {
    const regexForUuid =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
    return regexForUuid.test(id)
  }

  /**
   * Checks if this ID equals another ID.
   */
  equals(otherId: T): boolean {
    return this.value === otherId.value
  }

  /**
   * Returns the string representation of the ID.
   */
  toString(): string {
    return this.value
  }

  /**
   * Returns the raw value of the ID.
   */
  getValue(): string {
    return this.value
  }

  /**
   * Checks if this ID is empty.
   */
  isEmpty(): boolean {
    return this.value === ''
  }
}
