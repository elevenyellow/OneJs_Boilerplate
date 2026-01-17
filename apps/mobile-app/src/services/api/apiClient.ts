/**
 * Centralized API Client
 * Unified HTTP client with retry logic, timeout handling, and error normalization
 */

import { buildApiUrl, getDefaultHeaders, API_CONFIG } from '@/config/api'
import { getAuthToken } from '@/config/authToken'
import { devLog } from '@/utils/logger'
import { ApiError } from './errors'
import { networkMonitor, offlineQueue } from '../network'
import type { QueuedRequest } from '../network'

/**
 * Request options for API calls
 */
export interface RequestOptions {
  /** Custom timeout in milliseconds (default: API_CONFIG.TIMEOUT) */
  timeout?: number
  /** Number of retry attempts (default: API_CONFIG.RETRY_ATTEMPTS) */
  retries?: number
  /** Additional headers to merge with defaults */
  headers?: Record<string, string>
  /** Whether to queue request if offline (default: true for mutations) */
  queueIfOffline?: boolean
  /** Abort signal for cancellation */
  signal?: AbortSignal
}

/**
 * Internal request configuration
 */
interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  endpoint: string
  body?: unknown
  options: RequestOptions
}

/**
 * Calculate exponential backoff delay
 * Base delay doubles with each attempt: 1s, 2s, 4s, 8s...
 */
function calculateBackoffDelay(attempt: number): number {
  const baseDelay = API_CONFIG.RETRY_DELAY
  return baseDelay * 2 ** attempt
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Execute a single HTTP request with timeout
 */
async function executeRequest<T>(
  config: RequestConfig,
  attemptNumber: number,
): Promise<T> {
  const { method, endpoint, body, options } = config
  const url = buildApiUrl(endpoint)
  const timeout = options.timeout ?? API_CONFIG.TIMEOUT

  devLog.log(
    `🔄 [ApiClient] ${method} ${endpoint} (attempt ${attemptNumber + 1})`,
  )

  // Create abort controller for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  // Combine signals if external signal provided
  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort())
  }

  try {
    // Get authentication token
    const token = await getAuthToken()
    
    // Build headers with authentication
    const headers: HeadersInit = {
      ...getDefaultHeaders(),
      ...options.headers,
    }
    
    // Add Authorization header if token is available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    devLog.log(
      `📡 [ApiClient] Response: ${response.status} ${response.statusText}`,
    )

    // Handle non-OK responses
    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      devLog.error(`❌ [ApiClient] Error response:`, errorText)
      throw ApiError.fromResponse(response, errorText)
    }

    // Parse JSON response
    const responseData = await response.json()

    // Unwrap OneJs response format { success, message, data, timestamp }
    const data = responseData.data ?? responseData

    devLog.log(`✅ [ApiClient] Success:`, {
      endpoint,
      hasData: !!data,
    })

    return data as T
  } catch (error) {
    clearTimeout(timeoutId)

    // Handle abort (timeout or external cancellation)
    if (error instanceof Error && error.name === 'AbortError') {
      if (options.signal?.aborted) {
        throw new ApiError(
          'Request cancelled',
          'UNKNOWN',
          undefined,
          undefined,
          false,
        )
      }
      throw ApiError.timeout()
    }

    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error
    }

    // Wrap network errors
    if (error instanceof TypeError) {
      throw ApiError.networkError(error)
    }

    // Unknown error
    throw ApiError.unknown(error)
  }
}

/**
 * Execute request with retry logic
 */
async function requestWithRetry<T>(config: RequestConfig): Promise<T> {
  const maxRetries = config.options.retries ?? API_CONFIG.RETRY_ATTEMPTS

  let lastError: ApiError | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await executeRequest<T>(config, attempt)
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error
      }

      lastError = error

      // Don't retry non-retryable errors
      if (!error.isRetryable) {
        throw error
      }

      // Don't retry if we've exhausted attempts
      if (attempt >= maxRetries) {
        break
      }

      // Calculate backoff delay
      const delay = calculateBackoffDelay(attempt)
      devLog.log(
        `🔄 [ApiClient] Retrying in ${delay}ms... (${maxRetries - attempt} attempts left)`,
      )

      await sleep(delay)
    }
  }

  throw lastError ?? ApiError.unknown(new Error('Request failed after retries'))
}

/**
 * Main request handler with offline detection
 */
async function request<T>(config: RequestConfig): Promise<T> {
  // Check if offline
  if (!networkMonitor.isOnline) {
    const shouldQueue = config.options.queueIfOffline ?? config.method !== 'GET'

    if (shouldQueue) {
      devLog.log(
        `📦 [ApiClient] Offline, queueing ${config.method} ${config.endpoint}`,
      )

      await offlineQueue.enqueue({
        method: config.method,
        endpoint: config.endpoint,
        body: config.body,
        headers: config.options.headers,
      })

      throw ApiError.offline()
    }

    throw ApiError.offline()
  }

  return requestWithRetry<T>(config)
}

/**
 * Process a queued request (used by offline queue)
 * Note: Token will be automatically added by executeRequest
 */
export async function processQueuedRequest(
  queuedRequest: QueuedRequest,
): Promise<{ success: boolean; error?: string }> {
  try {
    await executeRequest(
      {
        method: queuedRequest.method as
          | 'GET'
          | 'POST'
          | 'PUT'
          | 'DELETE'
          | 'PATCH',
        endpoint: queuedRequest.endpoint,
        body: queuedRequest.body,
        options: {
          headers: queuedRequest.headers,
          retries: 0, // Don't retry within queue processing
        },
      },
      0,
    )

    return { success: true }
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}

/**
 * API Client
 * Centralized HTTP client for all API operations
 */
export const apiClient = {
  /**
   * GET request
   */
  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return request<T>({
      method: 'GET',
      endpoint,
      options: {
        ...options,
        queueIfOffline: options.queueIfOffline ?? false, // GETs don't queue by default
      },
    })
  },

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    body: unknown,
    options: RequestOptions = {},
  ): Promise<T> {
    return request<T>({
      method: 'POST',
      endpoint,
      body,
      options: {
        ...options,
        queueIfOffline: options.queueIfOffline ?? true, // Mutations queue by default
      },
    })
  },

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    body: unknown,
    options: RequestOptions = {},
  ): Promise<T> {
    return request<T>({
      method: 'PUT',
      endpoint,
      body,
      options: {
        ...options,
        queueIfOffline: options.queueIfOffline ?? true,
      },
    })
  },

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    body: unknown,
    options: RequestOptions = {},
  ): Promise<T> {
    return request<T>({
      method: 'PATCH',
      endpoint,
      body,
      options: {
        ...options,
        queueIfOffline: options.queueIfOffline ?? true,
      },
    })
  },

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return request<T>({
      method: 'DELETE',
      endpoint,
      options: {
        ...options,
        queueIfOffline: options.queueIfOffline ?? true,
      },
    })
  },
}
