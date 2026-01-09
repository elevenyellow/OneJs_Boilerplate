import { Inject, Injectable, Logger, OneJsError } from '@OneJs/core'
import { Coordinates } from '../../domain/value-objects/coordinates.vo'

/**
 * Response from Nominatim geocoding API
 */
interface NominatimResponse {
  lat: string
  lon: string
  display_name: string
  importance: number
}

/**
 * Injectable service for geocoding (city name → coordinates)
 * Uses Nominatim (OpenStreetMap) free geocoding API
 */
@Injectable()
export class GeocodingService {
  private readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org'
  private readonly USER_AGENT = 'ClimbZone-WeatherAPI/1.0'
  private readonly TIMEOUT = 10000

  // Simple in-memory cache to avoid repeated requests
  private readonly cache = new Map<string, Coordinates>()

  constructor(
    @Inject(Logger)
    private readonly logger: Logger,
  ) {}

  /**
   * Convert city name to coordinates
   * @param cityName - Name of the city (e.g., "Valencia", "Madrid", "Barcelona")
   * @returns Coordinates object
   */
  async cityToCoordinates(cityName: string): Promise<Coordinates> {
    const cacheKey = cityName.toLowerCase().trim()

    // Check cache first
    if (this.cache.has(cacheKey)) {
      this.logger.debug('geocoding:service', `Cache hit for "${cityName}"`)
      return this.cache.get(cacheKey)!
    }

    this.logger.debug('geocoding:service', `Geocoding city: "${cityName}"`)

    try {
      const url = this.buildGeocodingUrl(cityName)
      const results = await this.fetchWithTimeout(url)

      if (!results || results.length === 0) {
        throw new OneJsError(
          'CITY_NOT_FOUND',
          404,
          `City "${cityName}" not found in geocoding database`,
        )
      }

      // Take the first (most relevant) result
      const result = results[0]
      const coordinates = Coordinates.create(
        parseFloat(result.lat),
        parseFloat(result.lon),
      )

      // Cache the result
      this.cache.set(cacheKey, coordinates)

      this.logger.info(
        'geocoding:service',
        `Geocoded "${cityName}" to ${coordinates.toString()} (${result.display_name})`,
      )

      return coordinates
    } catch (error) {
      if (error instanceof OneJsError) {
        throw error
      }

      throw new OneJsError(
        'GEOCODING_FAILED',
        503,
        `Failed to geocode city "${cityName}": ${(error as Error).message}`,
      )
    }
  }

  /**
   * Build Nominatim API URL
   */
  private buildGeocodingUrl(cityName: string): string {
    const params = new URLSearchParams({
      q: cityName,
      format: 'json',
      limit: '1',
      addressdetails: '1',
    })

    return `${this.NOMINATIM_URL}/search?${params.toString()}`
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(url: string): Promise<NominatimResponse[]> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT)

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': this.USER_AGENT,
          Accept: 'application/json',
        },
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data as NominatimResponse[]
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new OneJsError(
          'GEOCODING_TIMEOUT',
          408,
          `Geocoding request timeout after ${this.TIMEOUT}ms`,
        )
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Clear the geocoding cache
   */
  clearCache(): void {
    this.cache.clear()
    this.logger.debug('geocoding:service', 'Cache cleared')
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size
  }
}
