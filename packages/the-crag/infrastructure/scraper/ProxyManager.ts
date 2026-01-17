import { logger } from '@OneJs/core'
import { getProxyUrls } from '@shared'

/**
 * Proxy configuration parsed from URL
 */
export interface ProxyConfig {
  url: string
  host: string
  port: number
  protocol: 'http' | 'https' | 'socks5'
  username?: string
  password?: string
  failures: number
  lastUsed: number
  disabled: boolean
}

/**
 * ProxyManager - Manages a pool of proxies with rotation (Singleton)
 *
 * Features:
 * - Single instance shared across the application
 * - Random proxy selection for less predictable patterns
 * - Automatic failure tracking
 * - Temporary disable after max failures
 * - Re-enable after cooldown period
 */
export class ProxyManager {
  // Singleton instance
  private static instance: ProxyManager | null = null

  private proxies: ProxyConfig[] = []
  private readonly maxFailures: number
  private readonly cooldownMs: number

  // Private constructor to prevent direct instantiation
  private constructor(options?: { maxFailures?: number; cooldownMs?: number }) {
    this.maxFailures = options?.maxFailures ?? 5
    this.cooldownMs = options?.cooldownMs ?? 60000 // 1 minute cooldown

    // Load proxies from environment variable
    const proxyUrls = getProxyUrls()
    if (proxyUrls.length > 0) {
      this.addProxies(proxyUrls)
    } else {
      logger.warn(
        'MATO:SCRAPER:PROXY',
        'No proxies configured. Set PROXY_URLS environment variable.',
      )
    }
  }

  /**
   * Get the singleton instance of ProxyManager
   */
  static getInstance(options?: {
    maxFailures?: number
    cooldownMs?: number
  }): ProxyManager {
    if (!ProxyManager.instance) {
      ProxyManager.instance = new ProxyManager(options)
      logger.info(
        'MATO:SCRAPER:PROXY',
        'ProxyManager singleton instance created',
      )
    }
    return ProxyManager.instance
  }

  /**
   * Reset the singleton instance (useful for testing or reinitialization)
   */
  static resetInstance(): void {
    if (ProxyManager.instance) {
      ProxyManager.instance.clear()
      ProxyManager.instance = null
      logger.info('MATO:SCRAPER:PROXY', 'ProxyManager singleton instance reset')
    }
  }

  /**
   * Add proxies from URL strings
   * Format: http://user:pass@host:port or http://host:port
   */
  addProxies(proxyUrls: string[]): void {
    for (const url of proxyUrls) {
      const config = this.parseProxyUrl(url)
      if (config) {
        this.proxies.push(config)
      }
    }
    logger.info(
      'MATO:SCRAPER:PROXY',
      `Added ${this.proxies.length} proxies to pool`,
    )
  }

  /**
   * Parse a proxy URL into ProxyConfig
   */
  private parseProxyUrl(proxyUrl: string): ProxyConfig | null {
    try {
      const url = new URL(proxyUrl)

      const protocol = url.protocol.replace(':', '') as
        | 'http'
        | 'https'
        | 'socks5'
      if (!['http', 'https', 'socks5'].includes(protocol)) {
        logger.warn('MATO:SCRAPER:PROXY', `Unsupported protocol: ${protocol}`)
        return null
      }

      return {
        url: proxyUrl,
        host: url.hostname,
        port: parseInt(url.port, 10) || (protocol === 'https' ? 443 : 80),
        protocol,
        username: url.username || undefined,
        password: url.password || undefined,
        failures: 0,
        lastUsed: 0,
        disabled: false,
      }
    } catch {
      logger.warn(
        'MATO:SCRAPER:PROXY',
        `Failed to parse proxy URL: ${proxyUrl}`,
      )
      return null
    }
  }

  /**
   * Get the next available proxy (random selection)
   * Returns null if no proxies available
   */
  getNext(): ProxyConfig | null {
    if (this.proxies.length === 0) {
      return null
    }

    // Re-enable proxies that have cooled down
    this.checkCooldowns()

    // Filter available proxies (not disabled)
    const availableProxies = this.proxies.filter((p) => !p.disabled)

    if (availableProxies.length > 0) {
      // Random selection from available proxies
      const randomIndex = Math.floor(Math.random() * availableProxies.length)
      const proxy = availableProxies[randomIndex]
      proxy.lastUsed = Date.now()
      return proxy
    }

    // All proxies disabled, force re-enable the one with lowest failures
    logger.warn(
      'MATO:SCRAPER:PROXY',
      'All proxies disabled, force re-enabling one',
    )
    const bestProxy = this.proxies.reduce((best, current) =>
      current.failures < best.failures ? current : best,
    )
    bestProxy.disabled = false
    bestProxy.failures = 0
    bestProxy.lastUsed = Date.now()
    return bestProxy
  }

  /**
   * Get curl arguments for a proxy
   */
  getCurlArgs(proxy: ProxyConfig): string[] {
    const args: string[] = ['-x', proxy.url]
    return args
  }

  /**
   * Report a successful request through a proxy
   */
  reportSuccess(proxy: ProxyConfig): void {
    // Reset failure count on success
    proxy.failures = 0
    proxy.disabled = false
  }

  /**
   * Report a failed request through a proxy
   */
  reportFailure(proxy: ProxyConfig): void {
    proxy.failures++
    logger.warn(
      'MATO:SCRAPER:PROXY',
      `Proxy ${proxy.host}:${proxy.port} failed (${proxy.failures}/${this.maxFailures})`,
    )

    if (proxy.failures >= this.maxFailures) {
      proxy.disabled = true
      logger.warn(
        'MATO:SCRAPER:PROXY',
        `Proxy ${proxy.host}:${proxy.port} disabled after ${this.maxFailures} failures`,
      )
    }
  }

  /**
   * Check and re-enable proxies that have cooled down
   */
  private checkCooldowns(): void {
    const now = Date.now()
    for (const proxy of this.proxies) {
      if (proxy.disabled && now - proxy.lastUsed > this.cooldownMs) {
        proxy.disabled = false
        proxy.failures = Math.floor(proxy.failures / 2) // Reduce failures on cooldown
        logger.info(
          'MATO:SCRAPER:PROXY',
          `Proxy ${proxy.host}:${proxy.port} re-enabled after cooldown`,
        )
      }
    }
  }

  /**
   * Get stats about the proxy pool
   */
  getStats(): { total: number; active: number; disabled: number } {
    const disabled = this.proxies.filter((p) => p.disabled).length
    return {
      total: this.proxies.length,
      active: this.proxies.length - disabled,
      disabled,
    }
  }

  /**
   * Check if proxies are configured
   */
  hasProxies(): boolean {
    return this.proxies.length > 0
  }

  /**
   * Clear all proxies
   */
  clear(): void {
    this.proxies = []
  }
}
