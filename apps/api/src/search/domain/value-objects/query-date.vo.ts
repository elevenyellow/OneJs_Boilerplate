import { OneJsError, ErrorCodes } from '@OneJs/core'

/**
 * Value Object representing a query date for weather evaluation.
 * Format: ISO date string (YYYY-MM-DD)
 * Defaults to today's date.
 */
export class QueryDate {
  private static readonly DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

  private constructor(private readonly value: string) {}

  /**
   * Create from ISO date string (YYYY-MM-DD)
   * Validates format and date validity
   */
  static create(value: string): QueryDate {
    const trimmed = value.trim()

    if (!this.DATE_PATTERN.test(trimmed)) {
      throw new OneJsError(
        'Invalid date format',
        400,
        'Date must be in ISO format: YYYY-MM-DD',
        { value: trimmed },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    const parsed = new Date(trimmed)
    if (Number.isNaN(parsed.getTime())) {
      throw new OneJsError(
        'Invalid date',
        400,
        'Date is not a valid calendar date',
        { value: trimmed },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    return new QueryDate(trimmed)
  }

  /**
   * Create from query parameter string, defaulting to today if empty/undefined
   */
  static createFromQuery(queryValue: string | undefined): QueryDate {
    const trimmed = queryValue?.trim()
    if (!trimmed) {
      return QueryDate.today()
    }
    return QueryDate.create(trimmed)
  }

  /**
   * Create QueryDate for today
   */
  static today(): QueryDate {
    const todayIso = new Date().toISOString().split('T')[0]
    return new QueryDate(todayIso)
  }

  getValue(): string {
    return this.value
  }

  toDate(): Date {
    return new Date(this.value)
  }

  equals(other: QueryDate): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
