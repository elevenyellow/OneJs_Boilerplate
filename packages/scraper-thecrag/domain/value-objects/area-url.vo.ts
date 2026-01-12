import { ErrorCodes, OneJsError } from '@OneJs/core'

/**
 * Value Object representing the URL of a climbing area.
 * Encapsulates validation and TheCrag-specific URL behavior.
 */
export class AreaUrl {
  private static readonly THECRAG_DOMAIN = 'thecrag.com'

  private constructor(private readonly value: string) {}

  /**
   * Creates an AreaUrl from user input with full validation.
   * Use this for external/untrusted input.
   */
  static create(value: string): AreaUrl {
    const trimmed = value.trim()

    if (trimmed.length === 0) {
      throw new OneJsError(
        'Area URL cannot be empty',
        400,
        'Area URL is required and cannot be empty or whitespace-only',
        { value },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    return new AreaUrl(trimmed)
  }

  /**
   * Creates an AreaUrl from trusted source (e.g., database or API response).
   * Performs minimal validation for performance.
   */
  static createFrom(value: string): AreaUrl {
    const trimmed = value.trim()

    if (trimmed.length === 0) {
      throw new OneJsError(
        'Area URL from trusted source is empty',
        500,
        'Trusted source contains invalid area URL',
        { value },
        ErrorCodes.SERVER_ERROR,
      )
    }

    return new AreaUrl(trimmed)
  }

  getValue(): string {
    return this.value
  }

  /**
   * Checks if this URL is from TheCrag domain.
   */
  isTheCragUrl(): boolean {
    return this.value.includes(AreaUrl.THECRAG_DOMAIN)
  }

  toString(): string {
    return this.value
  }

  equals(other: AreaUrl): boolean {
    return this.value === other.value
  }

  toDto(): string {
    return this.value
  }
}
