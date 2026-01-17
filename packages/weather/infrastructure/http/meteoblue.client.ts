import { Inject, Injectable, Logger, OneJsError } from '@OneJs/core'
import got, { HTTPError, TimeoutError } from 'got'
import { HttpsProxyAgent } from 'hpagent'
import * as crypto from 'node:crypto'
import { getProxyUrls, hasProxyUrls } from '@shared'
import { Coordinates } from '../../domain/value-objects/coordinates.vo'
import type {
  MeteoblueAPIResponse,
  MeteoblueClientConfig,
  MeteobluePackage,
} from './meteoblue-api.types'

// Simple round-robin index for proxy rotation
let currentProxyIndex = 0

/**
 * Injectable HTTP client for Meteoblue API
 * Handles URL construction, retries, error handling
 */
@Injectable()
export class MeteoblueClient {
  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly sharedSecret: string
  private readonly timeout: number
  private readonly maxRetries: number
  private readonly retryDelayMs: number
  private readonly defaultPackages: string[]

  constructor(
    @Inject(Logger)
    private readonly logger: Logger,
    config?: MeteoblueClientConfig,
  ) {
    // Read from environment or config
    this.apiKey = config?.apiKey || process.env.METEOBLUE_API_KEY || ''
    this.sharedSecret =
      config?.sharedSecret || process.env.METEOBLUE_SHARED_SECRET || 'j}8Lb}?H'

    if (!this.apiKey) {
      throw new OneJsError(
        'METEOBLUE_CONFIG_ERROR',
        500,
        'METEOBLUE_API_KEY is not configured. Set it in environment variables or pass via config.',
      )
    }

    this.baseUrl = config?.baseUrl || 'https://my.meteoblue.com'
    this.timeout = config?.timeout || 30000
    this.maxRetries = config?.maxRetries || 3
    this.retryDelayMs = config?.retryDelayMs || 2000

    // Default packages (essential fields for climbing conditions)
    // basic-day: temperature, wind, precipitation, humidity, UV, pictocode (daily)
    // basic-1h: hourly temperature, wind, precipitation, humidity, UV, pictocode
    // sunmoon: sunrise, sunset, sunshinetime (for orientation timing)
    // wind-day: detailed wind data (max, mean, direction)
    this.defaultPackages = config?.defaultPackages || [
      'basic-day',
      'basic-1h',
      'wind-day',
      'sunmoon',
    ]
  }

  /**
   * Fetch weather data for given coordinates
   */
  async fetchWeatherData(
    coordinates: Coordinates,
    customPackages?: MeteobluePackage[],
  ): Promise<MeteoblueAPIResponse> {
    const url = this.buildUrl(coordinates, customPackages)

    this.logger.debug('meteoblue:client', `Fetching weather data: ${url}`)

    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url)

        // Validate response
        if (!response.metadata || !response.units) {
          throw new OneJsError(
            'INVALID_RESPONSE',
            500,
            'Invalid Meteoblue API response structure',
          )
        }

        this.logger.debug(
          'meteoblue:client',
          `Successfully fetched weather for ${coordinates.toString()}`,
        )

        return response
      } catch (error) {
        lastError = error as Error

        this.logger.warn(
          'meteoblue:client',
          `Attempt ${attempt}/${this.maxRetries} failed: ${lastError.message}`,
        )

        // Don't retry on client errors (4xx)
        if (
          error instanceof OneJsError &&
          error.statusCode >= 400 &&
          error.statusCode < 500
        ) {
          throw error
        }

        if (attempt < this.maxRetries) {
          const delay = this.retryDelayMs * attempt // Exponential backoff
          this.logger.debug('meteoblue:client', `Retrying in ${delay}ms...`)
          await this.delay(delay)
        }
      }
    }

    throw new OneJsError(
      'METEOBLUE_FETCH_FAILED',
      503,
      `Failed to fetch weather after ${this.maxRetries} attempts: ${lastError?.message}`,
    )
  }

  /**
   * Build the complete Meteoblue API URL with signature
   * Based on EXACT format that works 100% (from test-blue.ts)
   * IMPORTANT: Parameter order affects signature!
   */
  private buildUrl(
    coordinates: Coordinates,
    customPackages?: MeteobluePackage[],
  ): string {
    const packages = customPackages?.join('_') || this.defaultPackages.join('_')

    // Generate expiration timestamp (10 minutes from now, as observed in working code)
    const expire = Math.floor(Date.now() / 1000) + 600

    // Format coordinates exactly as in working code (as strings!)
    const lat = coordinates.latitude.toFixed(3) // e.g., "38.273"
    const lon = coordinates.longitude.toFixed(4) // e.g., "-0.5397"

    // CRITICAL: Parameters MUST be in this EXACT order for signature to match!
    // This order is from test-blue.ts which works 100%
    // Note: We skip 'city' as we don't have city name, only coordinates
    const params: [string, string][] = [
      ['lat', lat],
      ['lon', lon],
      ['asl', '17.0'], // Note: 17.0 with decimal (as in working code)
      ['tz', 'Europe/Madrid'],
      ['temperature', 'C'],
      ['windspeed', 'ms-1'],
      ['precipitationamount', 'mm'],
      ['winddirection', '2char'],
      ['timeformat', 'iso8601'],
      ['history_days', '1'],
      ['forecast_days', '8'],
      ['expire', expire.toString()],
      ['apikey', this.apiKey],
    ]

    // Build query string maintaining exact order
    const queryString = params
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&')

    // THE KEY: Path MUST include the packages
    // Format: /packages/PACKAGES?PARAMS&secret=SECRET
    const urlPathForSigning = `/packages/${packages}?${queryString}&secret=${this.sharedSecret}`

    // Generate signature: MD5(urlPathForSigning)
    const signature = this.generateSignature(urlPathForSigning)

    // Return complete URL with signature (without secret in URL)
    return `${this.baseUrl}/packages/${packages}?${queryString}&sig=${signature}`
  }

  /**
   * Generate Meteoblue API signature
   * Replicates the logic from com.meteoblue.droid.data.network.ApiUtility
   *
   * @param urlPathWithSecret - The complete URL path including secret parameter
   * @returns MD5 hash signature
   */
  private generateSignature(urlPathWithSecret: string): string {
    // Generate MD5 hash of the complete URL path (including secret)
    return crypto
      .createHash('md5')
      .update(urlPathWithSecret, 'utf8')
      .digest('hex')
  }

  /**
   * Get next proxy URL using round-robin rotation
   */
  private getNextProxy(): string | null {
    const proxies = getProxyUrls()
    if (proxies.length === 0) {
      return null
    }
    const proxy = proxies[currentProxyIndex % proxies.length]
    currentProxyIndex = (currentProxyIndex + 1) % proxies.length
    return proxy
  }

  /**
   * Fetch with timeout using got library
   * Supports proxy rotation when proxies are configured
   */
  private async fetchWithTimeout(url: string): Promise<MeteoblueAPIResponse> {
    try {
      const useProxy = hasProxyUrls()
      const proxyUrl = useProxy ? this.getNextProxy() : null

      // Build got options
      const gotOptions = {
        timeout: {
          request: this.timeout,
          connect: 10000,
        },
        headers: {
          'User-Agent': 'MeteoblueDroid/1.40.10 (Android 14; Pixel 4a)',
          Accept: 'application/json',
        },
        retry: {
          limit: 0, // We handle retries at higher level
        },
        responseType: 'json' as const,
        agent: proxyUrl
          ? { https: new HttpsProxyAgent({ proxy: proxyUrl }) }
          : undefined,
      }

      if (proxyUrl) {
        this.logger.debug('meteoblue:client', 'Using proxy for request')
      }

      const response = await got.get<MeteoblueAPIResponse>(url, gotOptions)

      return response.body
    } catch (error: unknown) {
      // Handle got-specific errors
      if (error instanceof HTTPError) {
        this.handleHttpError(
          error.response.statusCode,
          error.response.statusMessage || '',
        )
      }

      if (error instanceof TimeoutError) {
        throw new OneJsError(
          'TIMEOUT',
          408,
          `Request timeout after ${this.timeout}ms`,
        )
      }

      if (error instanceof OneJsError) {
        throw error
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error)
      throw new OneJsError(
        'NETWORK_ERROR',
        503,
        `Network error: ${errorMessage}`,
      )
    }
  }

  /**
   * Handle HTTP error responses
   */
  private handleHttpError(status: number, statusText: string): never {
    if (status === 401) {
      throw new OneJsError('UNAUTHORIZED', 401, 'Invalid Meteoblue API key')
    }
    if (status === 429) {
      throw new OneJsError(
        'RATE_LIMITED',
        429,
        'Meteoblue API rate limit exceeded',
      )
    }
    if (status === 404) {
      throw new OneJsError(
        'NOT_FOUND',
        404,
        'Location not found in Meteoblue database',
      )
    }

    throw new OneJsError(
      'HTTP_ERROR',
      status,
      `Meteoblue API error: ${status} ${statusText}`,
    )
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Health check - verify API is accessible
   */
  async isAccessible(): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'HEAD',
        headers: { 'User-Agent': 'ClimbZone-WeatherAPI/1.0' },
      })
      return response.ok
    } catch {
      return false
    }
  }
}
