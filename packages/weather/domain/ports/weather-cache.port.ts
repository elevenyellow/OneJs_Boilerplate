import type { WeatherData } from '../entities/weather-response.entity'

/**
 * Configuration for weather cache
 */
export interface WeatherCacheConfig {
  /**
   * TTL for current weather data in milliseconds
   * Default: 15 minutes
   */
  currentWeatherTtlMs: number
  /**
   * TTL for forecast data in milliseconds
   * Default: 1 hour
   */
  forecastTtlMs: number
  /**
   * Maximum number of entries in the cache
   * Default: 1000
   */
  maxEntries: number
  /**
   * Precision for coordinates (decimal places)
   * Default: 2 (~1km accuracy)
   */
  coordinatePrecision: number
}

/**
 * Cache statistics
 */
export interface WeatherCacheStats {
  size: number
  maxEntries: number
  currentTtlMinutes: number
  forecastTtlMinutes: number
}

/**
 * Port for weather data caching.
 * Allows swapping implementations (in-memory for dev, Redis for production).
 *
 * All methods are async to support both in-memory and distributed cache implementations.
 */
export interface IWeatherCache {
  /**
   * Get weather data from cache
   * @param lat Latitude (will be rounded to configured precision)
   * @param lon Longitude (will be rounded to configured precision)
   * @returns Weather data or null if not found/expired
   */
  get(lat: number, lon: number): Promise<WeatherData | null>

  /**
   * Store weather data in cache
   * @param lat Latitude
   * @param lon Longitude
   * @param data Weather data to cache
   * @param useForecastTtl Use forecast TTL (1h) instead of current TTL (15min)
   */
  set(
    lat: number,
    lon: number,
    data: WeatherData,
    useForecastTtl?: boolean,
  ): Promise<void>

  /**
   * Remove weather data from cache
   * @returns true if entry was deleted, false if not found
   */
  delete(lat: number, lon: number): Promise<boolean>

  /**
   * Check if cache contains valid (non-expired) data for coordinates
   */
  has(lat: number, lon: number): Promise<boolean>

  /**
   * Get remaining TTL in milliseconds for an entry
   * @returns TTL in ms, or 0 if not found/expired
   */
  getTtl(lat: number, lon: number): Promise<number>

  /**
   * Clear all entries from the cache
   */
  clear(): Promise<void>

  /**
   * Get current cache size
   */
  size(): Promise<number>

  /**
   * Get cache statistics
   */
  getStats(): Promise<WeatherCacheStats>
}
