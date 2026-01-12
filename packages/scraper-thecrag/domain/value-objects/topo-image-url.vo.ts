import { ErrorCodes, OneJsError } from '@OneJs/core'

/**
 * Value Object representing a URL for a topo image.
 * Can be either a thumbnail URL or a full-size image URL.
 */
export class TopoImageUrl {
  private constructor(private readonly value: string) {}

  /**
   * Creates a TopoImageUrl from user/external input with full validation.
   */
  static create(value: string): TopoImageUrl {
    const trimmed = value.trim()

    if (!trimmed || trimmed.length === 0) {
      throw new OneJsError(
        'Invalid topo image URL',
        400,
        'Topo image URL cannot be empty',
        { value },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      throw new OneJsError(
        'Invalid topo image URL',
        400,
        'Topo image URL must start with http:// or https://',
        { value },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    return new TopoImageUrl(trimmed)
  }

  /**
   * Creates a TopoImageUrl from trusted input (e.g., database).
   * Returns empty URL if value is empty or undefined.
   */
  static createFrom(value: string): TopoImageUrl {
    if (!value || value.trim().length === 0) {
      return TopoImageUrl.empty()
    }

    return new TopoImageUrl(value.trim())
  }

  /**
   * Creates an empty TopoImageUrl for cases where URL is not available.
   */
  static empty(): TopoImageUrl {
    return new TopoImageUrl('')
  }

  getValue(): string {
    return this.value
  }

  /**
   * Returns true if this URL is empty (not available).
   */
  isEmpty(): boolean {
    return this.value.length === 0
  }

  /**
   * Returns true if this URL appears to be a thumbnail based on size indicators.
   * Thumbnails typically contain size dimensions like -100x100 or similar patterns.
   */
  isThumbnail(): boolean {
    if (this.isEmpty()) {
      return false
    }

    // Common patterns for thumbnail URLs:
    // - Contains dimensions like -100x100, _200x200, etc.
    // - Contains /thumb/ or /thumbnail/ in path
    const dimensionPattern = /[-_]\d+x\d+/
    const pathPattern = /\/(thumb|thumbnail)\//i

    return dimensionPattern.test(this.value) || pathPattern.test(this.value)
  }

  equals(other: TopoImageUrl): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
