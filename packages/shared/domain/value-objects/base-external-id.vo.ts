/**
 * Base abstract class for external system identifiers.
 * Each bounded context should extend this class for its own ExternalId value object.
 *
 * @example
 * ```typescript
 * // packages/routes/domain/value-objects/external-id.vo.ts
 * import { BaseExternalId } from '@shared/domain/value-objects'
 *
 * export class ExternalId extends BaseExternalId<ExternalId> {
 *   protected createInstance(value: string): ExternalId {
 *     return new ExternalId(value)
 *   }
 * }
 * ```
 */
export abstract class BaseExternalId<T extends BaseExternalId<T>> {
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
   * Validates the external ID value.
   * Available to subclasses for validation.
   * Can be overridden for custom validation.
   */
  static validateValue(value: string | number | null | undefined): void {
    if (value === '' || value === null || value === undefined) {
      throw new Error('ExternalId cannot be empty')
    }
  }

  /**
   * Checks if this external ID is empty.
   */
  isEmpty(): boolean {
    return this.value === ''
  }

  /**
   * Checks if this external ID equals another.
   */
  equals(otherId: T): boolean {
    return this.value === otherId.value
  }

  /**
   * Returns the string representation.
   */
  toString(): string {
    return this.value
  }

  /**
   * Returns the raw value.
   */
  getValue(): string {
    return this.value
  }
}
