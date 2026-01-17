import { OneJsError, ErrorCodes } from '@OneJs/core'

const DEFAULT_LIMIT = 20
const MIN_LIMIT = 1
const MAX_LIMIT = 100

/**
 * Value Object representing the result limit for search queries
 */
export class SearchLimit {
  private constructor(private readonly value: number) {}

  /**
   * Create SearchLimit from query parameter
   * Defaults to 20 if not provided or invalid
   */
  static createFromQuery(queryValue?: string): SearchLimit {
    if (!queryValue) {
      return SearchLimit.default()
    }

    const parsed = Number.parseInt(queryValue, 10)
    if (Number.isNaN(parsed)) {
      return SearchLimit.default()
    }

    return SearchLimit.create(parsed)
  }

  /**
   * Create SearchLimit with validation
   */
  static create(value: number): SearchLimit {
    if (value < MIN_LIMIT || value > MAX_LIMIT) {
      throw new OneJsError(
        'Invalid limit',
        400,
        `limit must be between ${MIN_LIMIT} and ${MAX_LIMIT}`,
        { limit: value },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    return new SearchLimit(value)
  }

  /**
   * Get default limit (20)
   */
  static default(): SearchLimit {
    return new SearchLimit(DEFAULT_LIMIT)
  }

  /**
   * Get the limit value
   */
  getValue(): number {
    return this.value
  }
}
