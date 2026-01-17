/**
 * Centralized API Error Types
 * Unified error handling for all API calls in the mobile app
 */

/**
 * API error codes for categorizing errors
 */
export type ApiErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'OFFLINE'
  | 'SERVER_ERROR'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'UNKNOWN'

/**
 * Unified API error class for all API operations
 *
 * Provides consistent error handling across all API modules with:
 * - Error categorization via error codes
 * - HTTP status code tracking
 * - Retry eligibility flag
 * - Additional error details for debugging
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: ApiErrorCode,
    public readonly statusCode?: number,
    public readonly details?: unknown,
    public readonly isRetryable: boolean = false,
  ) {
    super(message)
    this.name = 'ApiError'
  }

  /**
   * Create ApiError from HTTP response
   */
  static fromResponse(response: Response, errorText?: string): ApiError {
    const code = mapStatusToErrorCode(response.status)
    const isRetryable = response.status >= 500 || response.status === 429

    return new ApiError(
      errorText || `Request failed: ${response.statusText}`,
      code,
      response.status,
      errorText,
      isRetryable,
    )
  }

  /**
   * Create ApiError from network failure
   */
  static networkError(error: Error): ApiError {
    return new ApiError(
      'Network error - please check your connection',
      'NETWORK_ERROR',
      undefined,
      error.message,
      true,
    )
  }

  /**
   * Create ApiError from timeout
   */
  static timeout(): ApiError {
    return new ApiError(
      'Request timeout - please try again',
      'TIMEOUT',
      undefined,
      undefined,
      true,
    )
  }

  /**
   * Create ApiError for offline state
   */
  static offline(): ApiError {
    return new ApiError(
      'You are offline - request will be retried when connected',
      'OFFLINE',
      undefined,
      undefined,
      true,
    )
  }

  /**
   * Create ApiError for unknown errors
   */
  static unknown(error: unknown): ApiError {
    const message =
      error instanceof Error ? error.message : 'An unknown error occurred'
    return new ApiError(message, 'UNKNOWN', undefined, error, false)
  }
}

/**
 * Map HTTP status code to ApiErrorCode
 */
function mapStatusToErrorCode(status: number): ApiErrorCode {
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 403) return 'FORBIDDEN'
  if (status === 404) return 'NOT_FOUND'
  if (status === 422 || status === 400) return 'VALIDATION_ERROR'
  if (status >= 500) return 'SERVER_ERROR'
  return 'UNKNOWN'
}

/**
 * Type guard to check if error is ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
