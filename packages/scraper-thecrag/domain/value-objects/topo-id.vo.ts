import { ErrorCodes, OneJsError } from '@OneJs/core'

/**
 * Value Object representing a unique identifier for a topo image.
 * The ID comes from TheCrag's data-tid attribute.
 */
export class TopoId {
  private constructor(private readonly value: string) {}

  /**
   * Creates a TopoId from user/external input with full validation.
   */
  static create(value: string): TopoId {
    const trimmed = value.trim()

    if (!trimmed || trimmed.length === 0) {
      throw new OneJsError(
        'Invalid topo id',
        400,
        'Topo ID cannot be empty',
        { value },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    return new TopoId(trimmed)
  }

  /**
   * Creates a TopoId from trusted input (e.g., database).
   * Still validates that the value is not empty.
   */
  static createFrom(value: string): TopoId {
    if (!value || value.trim().length === 0) {
      throw new OneJsError(
        'Invalid topo id',
        400,
        'Topo ID cannot be empty',
        { value },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    return new TopoId(value.trim())
  }

  getValue(): string {
    return this.value
  }

  equals(other: TopoId): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
