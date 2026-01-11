import { logger } from '@OneJs/core'

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
 * ProxyManager - Manages a pool of proxies with rotation
 *
 * Features:
 * - Round-robin rotation
 * - Automatic failure tracking
 * - Temporary disable after max failures
 * - Re-enable after cooldown period
 */
export class ProxyManager {
  private proxies: ProxyConfig[] = []
  private currentIndex = 0
  private readonly maxFailures: number
  private readonly cooldownMs: number

  constructor(options?: { maxFailures?: number; cooldownMs?: number }) {
    this.maxFailures = options?.maxFailures ?? 5
    this.cooldownMs = options?.cooldownMs ?? 60000 // 1 minute cooldown
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
    logger.info('proxy-manager', `Added ${this.proxies.length} proxies to pool`)
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
        logger.warn('proxy-manager', `Unsupported protocol: ${protocol}`)
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
      logger.warn('proxy-manager', `Failed to parse proxy URL: ${proxyUrl}`)
      return null
    }
  }

  /**
   * Get the next available proxy (round-robin)
   * Returns null if no proxies available
   */
  getNext(): ProxyConfig | null {
    if (this.proxies.length === 0) {
      return null
    }

    // Re-enable proxies that have cooled down
    this.checkCooldowns()

    // Find next available proxy
    let attempts = 0

    while (attempts < this.proxies.length) {
      const proxy = this.proxies[this.currentIndex]
      this.currentIndex = (this.currentIndex + 1) % this.proxies.length

      if (!proxy.disabled) {
        proxy.lastUsed = Date.now()
        return proxy
      }

      attempts++
    }

    // All proxies disabled, force re-enable the one with lowest failures
    logger.warn('proxy-manager', 'All proxies disabled, force re-enabling one')
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
      'proxy-manager',
      `Proxy ${proxy.host}:${proxy.port} failed (${proxy.failures}/${this.maxFailures})`,
    )

    if (proxy.failures >= this.maxFailures) {
      proxy.disabled = true
      logger.warn(
        'proxy-manager',
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
          'proxy-manager',
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
    this.currentIndex = 0
  }
}

/**
 * Default proxy list for TheCrag scraping
 * 51 residential proxies
 */
export const DEFAULT_PROXIES = [
  'http://jlopez02:YJngdKqR@142.91.118.11:29842',
  'http://jlopez02:YJngdKqR@142.91.118.113:29842',
  'http://jlopez02:YJngdKqR@142.91.118.147:29842',
  'http://jlopez02:YJngdKqR@142.91.118.155:29842',
  'http://jlopez02:YJngdKqR@142.91.118.167:29842',
  'http://jlopez02:YJngdKqR@142.91.118.181:29842',
  'http://jlopez02:YJngdKqR@142.91.118.186:29842',
  'http://jlopez02:YJngdKqR@142.91.118.195:29842',
  'http://jlopez02:YJngdKqR@142.91.118.200:29842',
  'http://jlopez02:YJngdKqR@142.91.118.202:29842',
  'http://jlopez02:YJngdKqR@142.91.118.207:29842',
  'http://jlopez02:YJngdKqR@142.91.118.211:29842',
  'http://jlopez02:YJngdKqR@142.91.118.213:29842',
  'http://jlopez02:YJngdKqR@142.91.118.218:29842',
  'http://jlopez02:YJngdKqR@142.91.118.22:29842',
  'http://jlopez02:YJngdKqR@142.91.118.223:29842',
  'http://jlopez02:YJngdKqR@142.91.118.23:29842',
  'http://jlopez02:YJngdKqR@142.91.118.238:29842',
  'http://jlopez02:YJngdKqR@142.91.118.243:29842',
  'http://jlopez02:YJngdKqR@142.91.118.251:29842',
  'http://jlopez02:YJngdKqR@142.91.118.32:29842',
  'http://jlopez02:YJngdKqR@142.91.118.38:29842',
  'http://jlopez02:YJngdKqR@142.91.118.4:29842',
  'http://jlopez02:YJngdKqR@142.91.118.5:29842',
  'http://jlopez02:YJngdKqR@142.91.118.75:29842',
  'http://jlopez02:YJngdKqR@23.81.124.114:29842',
  'http://jlopez02:YJngdKqR@23.81.124.124:29842',
  'http://jlopez02:YJngdKqR@23.81.124.131:29842',
  'http://jlopez02:YJngdKqR@23.81.124.133:29842',
  'http://jlopez02:YJngdKqR@23.81.124.148:29842',
  'http://jlopez02:YJngdKqR@23.81.124.162:29842',
  'http://jlopez02:YJngdKqR@23.81.124.170:29842',
  'http://jlopez02:YJngdKqR@23.81.124.173:29842',
  'http://jlopez02:YJngdKqR@23.81.124.190:29842',
  'http://jlopez02:YJngdKqR@23.81.124.206:29842',
  'http://jlopez02:YJngdKqR@23.81.124.209:29842',
  'http://jlopez02:YJngdKqR@23.81.124.211:29842',
  'http://jlopez02:YJngdKqR@23.81.124.229:29842',
  'http://jlopez02:YJngdKqR@23.81.124.231:29842',
  'http://jlopez02:YJngdKqR@23.81.124.250:29842',
  'http://jlopez02:YJngdKqR@23.81.124.254:29842',
  'http://jlopez02:YJngdKqR@23.81.124.28:29842',
  'http://jlopez02:YJngdKqR@23.81.124.3:29842',
  'http://jlopez02:YJngdKqR@23.81.124.36:29842',
  'http://jlopez02:YJngdKqR@23.81.124.49:29842',
  'http://jlopez02:YJngdKqR@23.81.124.5:29842',
  'http://jlopez02:YJngdKqR@23.81.124.51:29842',
  'http://jlopez02:YJngdKqR@23.81.124.73:29842',
  'http://jlopez02:YJngdKqR@23.81.124.8:29842',
  'http://jlopez02:YJngdKqR@23.81.124.91:29842',
  'http://jlopez02:YJngdKqR@45.150.45.246:29842',
]
