import { Inject, Injectable, Logger, OneJsError } from '@OneJs/core'
import { Coordinates } from '../../domain/value-objects/coordinates.vo'
import type {
  MeteoblueAPIResponse,
  MeteoblueClientConfig,
  MeteobluePackage,
  MeteoblueQueryParams,
} from './meteoblue-api.types'

/**
 * Injectable HTTP client for Meteoblue API
 * Handles URL construction, retries, error handling
 */
@Injectable()
export class MeteoblueClient {
  private readonly baseUrl: string
  private readonly apiKey: string
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

    // Default packages (comprehensive)
    this.defaultPackages = config?.defaultPackages || [
      'mbweb_current',
      'wind-day',
      'wind-1h',
      'wind-3h',
      'clouds-day',
      'webcolors',
      'sunmoon',
      'basic-day',
      'basic-1h',
      'basic-3h',
      'airquality-3h',
      'airquality-1h',
      'pictosplitv2',
      'airquality-day',
      'trendpro-day',
      'trendpro-1h',
      'trendpro-3h',
      'pictosplit14day',
      'sunmoontrend',
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

        this.logger.info(
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
        if (error instanceof OneJsError && error.statusCode >= 400 && error.statusCode < 500) {
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
   * Build the complete Meteoblue API URL
   */
  private buildUrl(
    coordinates: Coordinates,
    customPackages?: MeteobluePackage[],
  ): string {
    const packages = customPackages?.join('_') || this.defaultPackages.join('_')
    
    const params: MeteoblueQueryParams = {
      apikey: this.apiKey,
      lat: coordinates.latitude,
      lon: coordinates.longitude,
      temperature: 'C',
      windspeed: 'kmh',
      precipitationamount: 'mm',
      winddirection: '2char',
      timeformat: 'timestamp_utc',
      history_days: 0,
      forecast_days: 8,
      tz: 'UTC',
      asl: 15,
    }

    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&')

    return `${this.baseUrl}/packages/${packages}?${queryString}`
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(url: string): Promise<MeteoblueAPIResponse> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'ClimbZone-WeatherAPI/1.0',
          Accept: 'application/json',
        },
        signal: controller.signal,
      })

      if (!response.ok) {
        // Handle specific HTTP errors
        if (response.status === 401) {
          throw new OneJsError(
            'UNAUTHORIZED',
            401,
            'Invalid Meteoblue API key',
          )
        }
        if (response.status === 429) {
          throw new OneJsError(
            'RATE_LIMITED',
            429,
            'Meteoblue API rate limit exceeded',
          )
        }
        if (response.status === 404) {
          throw new OneJsError(
            'NOT_FOUND',
            404,
            'Location not found in Meteoblue database',
          )
        }

        throw new OneJsError(
          'HTTP_ERROR',
          response.status,
          `Meteoblue API error: ${response.status} ${response.statusText}`,
        )
      }

      const data = await response.json()
      return data as MeteoblueAPIResponse
    } catch (error) {
      if (error instanceof OneJsError) {
        throw error
      }
      
      // Handle fetch errors (network, timeout, etc.)
      if ((error as Error).name === 'AbortError') {
        throw new OneJsError(
          'TIMEOUT',
          408,
          `Request timeout after ${this.timeout}ms`,
        )
      }

      throw new OneJsError(
        'NETWORK_ERROR',
        503,
        `Network error: ${(error as Error).message}`,
      )
    } finally {
      clearTimeout(timeoutId)
    }
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
