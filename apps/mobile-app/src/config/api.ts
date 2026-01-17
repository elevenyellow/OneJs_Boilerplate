/**
 * API Configuration
 * Base URL and default settings for API requests
 */

export const API_CONFIG = {
  BASE_URL: 'http://192.168.8.178:4000/api',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const

/**
 * Build full API URL from endpoint path
 */
export function buildApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${API_CONFIG.BASE_URL}${cleanEndpoint}`
}

/**
 * Default headers for API requests (without auth token)
 * The auth token is added separately in apiClient.ts
 */
export function getDefaultHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}
