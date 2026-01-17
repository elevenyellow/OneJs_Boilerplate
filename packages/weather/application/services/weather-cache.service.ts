import { Inject, Injectable, Logger } from '@OneJs/core'
import type { WeatherData } from '../../domain/entities/weather-response.entity'
import type {
  IWeatherCache,
  WeatherCacheStats,
} from '../../domain/ports/weather-cache.port'
import { InMemoryWeatherCache } from '../../infrastructure/cache/in-memory-weather-cache'
import { WeatherService } from './weather.service'

/**
 * Cache-enabled weather service.
 *
 * Wraps the WeatherService with caching to reduce API calls.
 * Uses TTL-based expiration:
 * - Current weather: 15 minutes (changes frequently)
 * - Forecast data: 1 hour (more stable)
 *
 * The cache implementation can be swapped (in-memory for dev, Redis for production)
 * by changing the injected IWeatherCache implementation.
 *
 * @example
 * ```typescript
 * const weather = await weatherCacheService.getWeatherByCoordinates(
 *   39.47,
 *   -0.38
 * )
 * // First call: fetches from API
 * // Subsequent calls within TTL: returns cached data
 * ```
 */
@Injectable()
export class WeatherCacheService {
  constructor(
    @Inject(WeatherService)
    private readonly weatherService: WeatherService,

    @Inject(InMemoryWeatherCache)
    private readonly cache: IWeatherCache,

    @Inject(Logger)
    private readonly logger: Logger,
  ) {
    this.logger.info('weather:cache', 'WeatherCacheService initialized')
  }

  /**
   * Get weather data with caching.
   *
   * Checks cache first, fetches from API if not found or expired.
   *
   * @param latitude - Latitude of the location
   * @param longitude - Longitude of the location
   * @param forceFresh - If true, bypass cache and fetch fresh data
   * @returns Weather data (from cache or API)
   */
  async getWeatherByCoordinates(
    latitude: number,
    longitude: number,
    forceFresh = false,
  ): Promise<WeatherData> {
    // Check cache first (unless forcing fresh)
    if (!forceFresh) {
      const cached = await this.cache.get(latitude, longitude)
      if (cached) {
        this.logger.debug(
          'weather:cache',
          `Cache hit for (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`,
        )
        return cached
      }
    }

    // Cache miss - fetch from API
    this.logger.debug(
      'weather:cache',
      `Cache miss for (${latitude.toFixed(2)}, ${longitude.toFixed(2)}), fetching from API`,
    )

    const query = this.weatherService.getByCoordinates({ latitude, longitude })
    const weatherData = await query.parsed()

    // Store in cache
    // Use forecast TTL if we have hourly/daily data
    const hasForecast =
      weatherData.hourly.length > 0 || weatherData.daily.length > 0
    await this.cache.set(latitude, longitude, weatherData, hasForecast)

    return weatherData
  }

  /**
   * Get weather data for a city with caching.
   *
   * Geocodes the city and uses coordinate-based caching.
   *
   * @param cityName - Name of the city
   * @param forceFresh - If true, bypass cache and fetch fresh data
   * @returns Weather data
   */
  async getWeatherByCity(
    cityName: string,
    forceFresh = false,
  ): Promise<WeatherData> {
    const query = await this.weatherService.getByCity(cityName)
    const weatherData = await query.parsed()

    const { lat, lon } = weatherData.metadata.coordinates

    // Check if we already have cached data for these coordinates
    if (!forceFresh) {
      const hasCached = await this.cache.has(lat, lon)
      if (hasCached) {
        const cached = await this.cache.get(lat, lon)
        if (cached) {
          return cached
        }
      }
    }

    // Store in cache
    const hasForecast =
      weatherData.hourly.length > 0 || weatherData.daily.length > 0
    await this.cache.set(lat, lon, weatherData, hasForecast)

    return weatherData
  }

  /**
   * Invalidate cache for specific coordinates
   */
  async invalidate(latitude: number, longitude: number): Promise<boolean> {
    const deleted = await this.cache.delete(latitude, longitude)
    if (deleted) {
      this.logger.debug(
        'weather:cache',
        `Invalidated cache for (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`,
      )
    }
    return deleted
  }

  /**
   * Clear entire cache
   */
  async clearCache(): Promise<void> {
    await this.cache.clear()
    this.logger.info('weather:cache', 'Cache cleared')
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<WeatherCacheStats> {
    return this.cache.getStats()
  }

  /**
   * Check if cache has valid data for coordinates
   */
  async isCached(latitude: number, longitude: number): Promise<boolean> {
    return this.cache.has(latitude, longitude)
  }

  /**
   * Get remaining TTL for cached data
   * @returns TTL in milliseconds, or 0 if not cached
   */
  async getCacheTtl(latitude: number, longitude: number): Promise<number> {
    return this.cache.getTtl(latitude, longitude)
  }
}
