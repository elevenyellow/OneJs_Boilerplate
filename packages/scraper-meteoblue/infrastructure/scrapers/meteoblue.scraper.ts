import { Inject, Injectable, Logger, OneJsError } from '@OneJs/core'
import { Coordinates } from '../../domain/value-objects/coordinates.vo'

const METEOBLUE_BASE_URL = 'https://www.meteoblue.com/en/weather/week'
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

interface ScraperOptions {
  maxRetries?: number
  retryDelayMs?: number
  timeoutMs?: number
}

@Injectable()
export class MeteoblueScraper {
  private readonly defaultOptions: Required<ScraperOptions> = {
    maxRetries: 3,
    retryDelayMs: 2000,
    timeoutMs: 30000,
  }

  constructor(
    @Inject(Logger)
    private readonly logger: Logger,
  ) {}

  /**
   * Fetch the weather page HTML from meteoblue
   * URL format: https://www.meteoblue.com/en/weather/week/{location}_{coordinates}
   */
  async fetchWeatherPage(
    locationName: string,
    coordinates: Coordinates,
    options?: ScraperOptions,
  ): Promise<string> {
    const opts = { ...this.defaultOptions, ...options }
    const url = this.buildUrl(locationName, coordinates)

    this.logger.debug('scraper:meteoblue', `Fetching: ${url}`)

    let lastError: Error | null = null

    for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
      try {
        const html = await this.fetchWithTimeout(url, opts.timeoutMs)

        // Validate response
        if (!html || html.length < 1000) {
          throw new Error('Response too short, possibly blocked or error page')
        }

        if (html.includes('captcha') || html.includes('rate limit')) {
          throw new OneJsError(
            'RATE_LIMITED',
            429,
            'Meteoblue rate limit detected, please try again later',
          )
        }

        return html
      } catch (error) {
        lastError = error as Error
        this.logger.warn(
          'scraper:meteoblue',
          `Attempt ${attempt}/${opts.maxRetries} failed for ${locationName}: ${lastError.message}`,
        )

        if (attempt < opts.maxRetries) {
          await this.delay(opts.retryDelayMs * attempt) // Exponential backoff
        }
      }
    }

    throw new OneJsError(
      'SCRAPER_FAILED',
      503,
      `Failed to fetch weather after ${opts.maxRetries} attempts: ${lastError?.message}`,
    )
  }

  /**
   * Build the meteoblue URL for a location
   */
  private buildUrl(locationName: string, coordinates: Coordinates): string {
    // Sanitize location name for URL
    const sanitizedName = locationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    const coordString = coordinates.toMeteoblueFormat()

    return `${METEOBLUE_BASE_URL}/${sanitizedName}_${coordString}`
  }

  /**
   * Fetch URL with timeout
   */
  private async fetchWithTimeout(
    url: string,
    timeoutMs: number,
  ): Promise<string> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': USER_AGENT,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0',
        },
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new OneJsError(
          'HTTP_ERROR',
          response.status,
          `HTTP ${response.status}: ${response.statusText}`,
        )
      }

      return await response.text()
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Check if meteoblue is accessible (health check)
   */
  async isAccessible(): Promise<boolean> {
    try {
      const response = await fetch('https://www.meteoblue.com', {
        method: 'HEAD',
        headers: { 'User-Agent': USER_AGENT },
      })
      return response.ok
    } catch {
      return false
    }
  }
}
