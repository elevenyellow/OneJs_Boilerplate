import { ErrorCodes, OneJsError } from '@OneJs/core'

/**
 * Value Object representing a URL stub for TheCrag nodes.
 * A URL stub is a path segment used to construct full URLs to TheCrag resources.
 * Examples: "chulilla", "spain/valencia/chulilla", "sector-name"
 */
export class UrlStub {
  private static readonly THECRAG_BASE_URL = 'https://www.thecrag.com/climbing'

  private constructor(private readonly value: string) {}

  /**
   * Creates a UrlStub with validation.
   * @throws OneJsError if the value is empty or whitespace-only
   */
  static create(value: string): UrlStub {
    const trimmed = value?.trim()

    if (!trimmed || trimmed.length === 0) {
      throw new OneJsError(
        'UrlStub cannot be empty',
        400,
        'URL stub value is required',
        { value },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    return new UrlStub(trimmed)
  }

  /**
   * Creates a UrlStub from a trusted source (minimal validation).
   * Use this when the value comes from the database or trusted API.
   */
  static createFrom(value: string): UrlStub {
    return new UrlStub(value?.trim() || '')
  }

  /**
   * Returns the URL stub value.
   */
  getValue(): string {
    return this.value
  }

  /**
   * Builds the full TheCrag URL from this stub and an optional ancestor stub.
   * @param ancestorStub Optional ancestor path (e.g., "spain/valencia/chulilla")
   * @returns Full URL (e.g., "https://www.thecrag.com/climbing/spain/valencia/chulilla/sector-name")
   */
  buildFullUrl(ancestorStub?: UrlStub): string {
    if (ancestorStub) {
      return `${UrlStub.THECRAG_BASE_URL}/${ancestorStub.getValue()}/${this.value}`
    }
    return `${UrlStub.THECRAG_BASE_URL}/${this.value}`
  }

  equals(other: UrlStub): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
