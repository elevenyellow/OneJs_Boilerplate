import { ErrorCodes, OneJsError } from '@OneJs/core'

/**
 * Value Object representing the name of a climbing area.
 * Encapsulates validation and behavior for area names.
 */
export class AreaName {
  private constructor(private readonly value: string) {}

  /**
   * Creates an AreaName from user input with full validation.
   * Use this for external/untrusted input.
   */
  static create(value: string): AreaName {
    const trimmed = value.trim()

    if (trimmed.length === 0) {
      throw new OneJsError(
        'Area name cannot be empty',
        400,
        'Area name is required and cannot be empty or whitespace-only',
        { value },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    return new AreaName(trimmed)
  }

  /**
   * Creates an AreaName from trusted source (e.g., database or API response).
   * Performs minimal validation for performance.
   */
  static createFrom(value: string): AreaName {
    const trimmed = value.trim()

    if (trimmed.length === 0) {
      throw new OneJsError(
        'Area name from trusted source is empty',
        500,
        'Trusted source contains invalid area name',
        { value },
        ErrorCodes.SERVER_ERROR,
      )
    }

    return new AreaName(trimmed)
  }

  getValue(): string {
    return this.value
  }

  toString(): string {
    return this.value
  }

  equals(other: AreaName): boolean {
    return this.value === other.value
  }

  toDto(): string {
    return this.value
  }
}
