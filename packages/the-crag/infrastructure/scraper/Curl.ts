const COOKIE =
  'ApacheSessionID=bdbf10d0e2064b1b4196ee0d6afa816208a52d15; userstatus=anon; NavCtx=/climbing/world; cf_clearance=FLCCerhetDGKAivb0pyzokcwg_DmnL7htMmD2tsWkRg-1767819670-1.2.1.1-B9WhjYDr61OG2P0BEAHBN4e9UuWYznqHghlonBTkASwg9fvb9B6AFEPMzmW9vYosVKejhKQmAoNs9AuKVg9wsVr75iSaWFB2lMIBxDgAiO1Ix41ohaeRrbVchFQBLml.Im2CMuij9kkkB5dsOFll.y8M1Lkl.Ds8zNPBVFaZL4eZs2fgef.P_AtMOM05dpUkab9O3cLQh9XInYd7MnSI5Pfd7gCqOdOgauu_yqGYFa0; _ga_E4F0QR29VH=GS2.1.s1767816546$o6$g1$t1767820204$j52$l0$h0; _ga=GA1.1.334307432.1767779711; acceptedterms=1'

import { logger } from '@OneJs'
import { ProxyManager } from './ProxyManager'

export class Curl {
  private readonly BASE_URL = 'https://www.thecrag.com'
  private readonly USER_AGENT =
    'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0'
  private readonly MAX_API_RETRIES = 3
  private readonly MAX_HTML_RETRIES = 3
  private readonly RETRY_BASE_DELAY_MS = 1000
  private readonly CURL_TIMEOUT_SECONDS = 30
  private readonly CURL_CONNECT_TIMEOUT_SECONDS = 10
  private readonly proxyManager: ProxyManager

  constructor(private readonly cookie: string = COOKIE) {
    // Use singleton instance of ProxyManager
    this.proxyManager = ProxyManager.getInstance({
      maxFailures: 5,
      cooldownMs: 60000,
    })
  }

  /**
   * Delay execution for exponential backoff between retries
   */
  private async delay(retryCount: number): Promise<void> {
    const delayMs = this.RETRY_BASE_DELAY_MS * (retryCount + 1)
    logger.debug(
      'scraper:curl',
      `Waiting ${delayMs}ms before retry ${retryCount + 1}`,
    )
    return new Promise((resolve) => setTimeout(resolve, delayMs))
  }

  /**
   * Make HTTP request using curl for API endpoints
   */
  async requestApi(url: string, retryCount = 0): Promise<string> {
    const proxy = this.proxyManager.getNext()

    if (!proxy) {
      throw new Error('No proxy available')
    }

    const args = [
      'curl',
      url,
      '--globoff',
      '--compressed',
      '-s',
      '--max-time',
      String(this.CURL_TIMEOUT_SECONDS),
      '--connect-timeout',
      String(this.CURL_CONNECT_TIMEOUT_SECONDS),
      '-H',
      `User-Agent: ${this.USER_AGENT}`,
      '-H',
      'Accept: */*',
      '-H',
      'Accept-Language: en-US,en;q=0.5',
      '-H',
      'Accept-Encoding: gzip, deflate, br, zstd',
      '-H',
      `Referer: ${this.BASE_URL}/en/climbing/world`,
      '-H',
      'X-Requested-With: XMLHttpRequest',
      '-H',
      'Connection: keep-alive',
      '-H',
      'Sec-Fetch-Dest: empty',
      '-H',
      'Sec-Fetch-Mode: cors',
      '-H',
      'Sec-Fetch-Site: same-origin',
      '-H',
      'TE: trailers',
    ]

    // Add proxy
    args.push('-x', proxy.url)
    args.push('-H', `Cookie: ${this.cookie}`)

    try {
      const proc = Bun.spawn(args)
      const result = await new Response(proc.stdout).text()

      // Check for actual blocking indicators (be more specific)
      const isBlocked = this.isResponseBlocked(result)

      if (isBlocked) {
        this.proxyManager.reportFailure(proxy)
        logger.warn(
          'scraper:requestApi',
          `Request blocked | URL: ${url} | Proxy: ${proxy.host}:${proxy.port} | Reason: ${isBlocked} | Attempt: ${retryCount + 1}/${this.MAX_API_RETRIES}`,
          {
            url,
            proxy: {
              host: proxy.host,
              port: proxy.port,
            },
            isBlocked,
            retryCount,
            maxRetries: this.MAX_API_RETRIES,
          },
        )
        // Retry with next proxy if we haven't exceeded max retries
        if (retryCount + 1 < this.MAX_API_RETRIES) {
          await this.delay(retryCount)
          return this.requestApi(url, retryCount + 1)
        }
        throw new Error(
          `Request blocked after ${this.MAX_API_RETRIES} attempts: ${isBlocked}`,
        )
      }

      this.proxyManager.reportSuccess(proxy)

      return result
    } catch (err) {
      this.proxyManager.reportFailure(proxy)

      // Retry network errors with next proxy if we haven't exceeded max retries
      if (retryCount + 1 < this.MAX_API_RETRIES) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        logger.warn(
          'scraper:requestApi',
          `Network error | URL: ${url} | Proxy: ${proxy.host}:${proxy.port} | Error: ${errorMessage} | Attempt: ${retryCount + 1}/${this.MAX_API_RETRIES}`,
          {
            url,
            proxy: {
              host: proxy.host,
              port: proxy.port,
            },
            error: errorMessage,
            retryCount,
            maxRetries: this.MAX_API_RETRIES,
          },
        )
        await this.delay(retryCount)
        return this.requestApi(url, retryCount + 1)
      }

      throw err
    }
  }

  /**
   * Make HTTP request using curl for HTML pages
   */
  async requestHtml(url: string, retryCount = 0): Promise<string> {
    const proxy = this.proxyManager.getNext()
    if (!proxy) {
      throw new Error('No proxy available')
    }

    const args = [
      'curl',
      url,
      '--globoff',
      '--compressed',
      '-s',
      '-L', // Follow redirects
      '--max-time',
      String(this.CURL_TIMEOUT_SECONDS),
      '--connect-timeout',
      String(this.CURL_CONNECT_TIMEOUT_SECONDS),
      '-H',
      `User-Agent: ${this.USER_AGENT}`,
      '-H',
      'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      '-H',
      'Accept-Language: en-US,en;q=0.5',
      '-H',
      'Accept-Encoding: gzip, deflate, br',
      '-H',
      'Connection: keep-alive',
      '-H',
      'Upgrade-Insecure-Requests: 1',
      '-H',
      'Sec-Fetch-Dest: document',
      '-H',
      'Sec-Fetch-Mode: navigate',
      '-H',
      'Sec-Fetch-Site: none',
      '-H',
      'Sec-Fetch-User: ?1',
    ]

    // Add proxy
    args.push('-x', proxy.url)
    args.push('-H', `Cookie: ${this.cookie}`)

    try {
      const proc = Bun.spawn(args)
      const result = await new Response(proc.stdout).text()

      // Check for actual blocking indicators
      const isBlocked = this.isHtmlResponseBlocked(result)

      if (isBlocked) {
        this.proxyManager.reportFailure(proxy)
        logger.warn(
          'scraper:requestHtml',
          `HTML blocked | URL: ${url} | Proxy: ${proxy.host}:${proxy.port} | Reason: ${isBlocked} | Attempt: ${retryCount + 1}/${this.MAX_HTML_RETRIES}`,
          {
            url,
            proxy: {
              host: proxy.host,
              port: proxy.port,
            },
            isBlocked,
            retryCount,
            maxRetries: this.MAX_HTML_RETRIES,
          },
        )
        // Retry with next proxy if we haven't exceeded max retries
        if (retryCount + 1 < this.MAX_HTML_RETRIES) {
          await this.delay(retryCount)
          return this.requestHtml(url, retryCount + 1)
        }
        throw new Error(
          `Request blocked after ${this.MAX_HTML_RETRIES} attempts: ${isBlocked}`,
        )
      }

      this.proxyManager.reportSuccess(proxy)

      return result
    } catch (err) {
      this.proxyManager.reportFailure(proxy)

      // Retry network errors with next proxy if we haven't exceeded max retries
      if (retryCount + 1 < this.MAX_HTML_RETRIES) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        logger.warn(
          'scraper:requestHtml',
          `Network error | URL: ${url} | Proxy: ${proxy.host}:${proxy.port} | Error: ${errorMessage} | Attempt: ${retryCount + 1}/${this.MAX_HTML_RETRIES}`,
          {
            url,
            proxy: {
              host: proxy.host,
              port: proxy.port,
            },
            error: errorMessage,
            retryCount,
            maxRetries: this.MAX_HTML_RETRIES,
          },
        )
        await this.delay(retryCount)
        return this.requestHtml(url, retryCount + 1)
      }

      throw err
    }
  }

  /**
   * Check if response indicates blocking/error (for API/JSON responses)
   * Returns false if OK, or a string describing the block reason
   */
  private isResponseBlocked(result: string): string | false {
    // Empty response - could be network error
    if (!result || result.length === 0) {
      return 'empty response'
    }

    const trimmed = result.trim()

    // Valid JSON responses from TheCrag API (even if empty)
    // TheCrag returns [[]] for empty results, [] for no data, {} for empty objects
    if (
      trimmed === '[]' ||
      trimmed === '{}' ||
      trimmed === 'null' ||
      trimmed === '[[]]' || // TheCrag empty response format
      trimmed.startsWith('[') || // Valid JSON array
      trimmed.startsWith('{') // Valid JSON object
    ) {
      return false // Valid response
    }

    // Specific blocking messages
    if (result.includes('Access Denied')) {
      return 'Access Denied'
    }
    if (result.includes('403 Forbidden')) {
      return '403 Forbidden'
    }
    if (result.includes('rate limit') || result.includes('Rate limit')) {
      return 'rate limited'
    }
    if (result.includes('blocked') && result.includes('IP')) {
      return 'IP blocked'
    }

    // Cloudflare/bot detection - be specific
    if (result.includes('cf-browser-verification')) {
      return 'Cloudflare challenge'
    }

    // Proxy authentication error - be specific to avoid false positives
    if (
      result.includes('Proxy Authentication Required') ||
      result.includes('407 Proxy Authentication')
    ) {
      return 'proxy auth failed'
    }

    // HTML error pages (not JSON)
    if (result.includes('<!DOCTYPE') || result.includes('<html')) {
      if (result.includes('Access Denied') || result.includes('Forbidden')) {
        return 'Access Denied (HTML)'
      }
      if (result.includes('cloudflare')) {
        return 'Cloudflare challenge'
      }
      // Could be a legitimate HTML response or error page
      return false
    }

    return false
  }

  /**
   * Check if HTML response indicates blocking/error
   */
  private isHtmlResponseBlocked(result: string): string | false {
    // Empty response
    if (!result || result.length === 0) {
      return 'empty response'
    }

    // Very short for HTML (less than 100 chars is suspicious for an HTML page)
    if (result.length < 100 && !result.includes('<')) {
      return `too short for HTML (${result.length} chars)`
    }

    // Specific blocking messages
    if (result.includes('Access Denied')) {
      return 'Access Denied'
    }
    if (result.includes('403 Forbidden')) {
      return '403 Forbidden'
    }
    if (result.includes('rate limit') || result.includes('Rate limit')) {
      return 'rate limited'
    }

    // Cloudflare/bot detection - be specific to avoid false positives
    // The actual block page has "Just a moment" as title, not just "challenge-platform" in scripts
    if (result.includes('cf-browser-verification')) {
      return 'Cloudflare challenge'
    }
    // Cloudflare waiting page - check for title specifically
    if (
      result.includes('<title>Just a moment...</title>') ||
      (result.includes('Just a moment...') && !result.includes('theCrag'))
    ) {
      return 'Cloudflare waiting page'
    }

    // Proxy errors - be specific to avoid false positives with coordinates like "407.6"
    if (
      result.includes('Proxy Authentication Required') ||
      result.includes('407 Proxy Authentication')
    ) {
      return 'proxy auth failed'
    }
    if (result.includes('502 Bad Gateway') || result.includes('503 Service')) {
      return 'proxy gateway error'
    }

    return false
  }
}
