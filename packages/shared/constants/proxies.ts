/**
 * Proxy configuration utilities.
 *
 * Reads proxy URLs from environment variable PROXY_URLS.
 * Format: comma-separated list of proxy URLs
 * Example: http://user:pass@host1:port,http://user:pass@host2:port
 */

/**
 * Get proxy URLs from environment variable.
 *
 * @returns Array of proxy URL strings, empty if not configured
 *
 * @example
 * ```typescript
 * import { getProxyUrls } from '@shared'
 *
 * const proxies = getProxyUrls()
 * // ['http://user:pass@host1:port', 'http://user:pass@host2:port', ...]
 * ```
 */
export function getProxyUrls(): string[] {
  const envProxies = process.env.PROXY_URLS
  if (!envProxies || envProxies.trim() === '') {
    return []
  }
  return envProxies
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean)
}

/**
 * Check if proxy URLs are configured in environment.
 *
 * @returns true if PROXY_URLS is set and contains at least one URL
 */
export function hasProxyUrls(): boolean {
  return getProxyUrls().length > 0
}
