import { ErrorCodes, OneJsError } from '@OneJs/core'

/**
 * Value Object representing the slug of a climbing area.
 * Slugs are URL-friendly identifiers used in TheCrag URLs.
 */
export class AreaSlug {
  private constructor(private readonly value: string) {}

  /**
   * Creates an AreaSlug from user input with full validation.
   * Use this for external/untrusted input.
   */
  static create(value: string): AreaSlug {
    const trimmed = value.trim()

    if (trimmed.length === 0) {
      throw new OneJsError(
        'Area slug cannot be empty',
        400,
        'Area slug is required and cannot be empty or whitespace-only',
        { value },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    return new AreaSlug(trimmed)
  }

  /**
   * Creates an AreaSlug from trusted source (e.g., database or API response).
   * Performs minimal validation for performance.
   */
  static createFrom(value: string): AreaSlug {
    const trimmed = value.trim()

    if (trimmed.length === 0) {
      throw new OneJsError(
        'Area slug from trusted source is empty',
        500,
        'Trusted source contains invalid area slug',
        { value },
        ErrorCodes.SERVER_ERROR,
      )
    }

    return new AreaSlug(trimmed)
  }

  getValue(): string {
    return this.value
  }

  toString(): string {
    return this.value
  }

  equals(other: AreaSlug): boolean {
    return this.value === other.value
  }

  toDto(): string {
    return this.value
  }
}
