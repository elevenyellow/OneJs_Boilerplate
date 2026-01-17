import { Injectable } from '@OneJs/core'
import type { WeatherData } from '../../domain/entities/weather-response.entity'
import type {
  IWeatherCache,
  WeatherCacheConfig,
  WeatherCacheStats,
} from '../../domain/ports/weather-cache.port'

// Re-export types for convenience
export type {
  WeatherCacheConfig,
  WeatherCacheStats,
} from '../../domain/ports/weather-cache.port'

/**
 * Cache entry with expiration
 */
interface CacheEntry<T> {
  data: T
  expiresAt: number
  createdAt: number
}

const DEFAULT_CONFIG: WeatherCacheConfig = {
  currentWeatherTtlMs: 15 * 60 * 1000, // 15 minutes
  forecastTtlMs: 60 * 60 * 1000, // 1 hour
  maxEntries: 1000,
  coordinatePrecision: 2,
}

/**
 * Cache key type for type safety
 */
type CacheKey = `weather:${string}:${string}`

/**
 * In-memory cache for weather data with TTL support.
 *
 * Implements IWeatherCache interface for easy swap to Redis in production.
 *
 * Features:
 * - TTL-based expiration (configurable for current vs forecast)
 * - Coordinate rounding for cache key deduplication
 * - LRU-style eviction when max entries reached
 * - Thread-safe for single Node.js process
 * - Async API for compatibility with distributed caches
 */
@Injectable()
export class InMemoryWeatherCache implements IWeatherCache {
  private readonly cache: Map<CacheKey, CacheEntry<WeatherData>>
  private readonly config: WeatherCacheConfig

  constructor(config?: Partial<WeatherCacheConfig>) {
    this.cache = new Map()
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Generate cache key from coordinates
   */
  private generateKey(lat: number, lon: number): CacheKey {
    const precision = this.config.coordinatePrecision
    const roundedLat = lat.toFixed(precision)
    const roundedLon = lon.toFixed(precision)
    return `weather:${roundedLat}:${roundedLon}`
  }

  /**
   * Check if an entry is expired
   */
  private isExpired(entry: CacheEntry<WeatherData>): boolean {
    return Date.now() > entry.expiresAt
  }

  /**
   * Evict expired entries and oldest entries if over capacity
   */
  private evictIfNeeded(): void {
    // First, remove expired entries
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }

    // If still over capacity, remove oldest entries
    while (this.cache.size >= this.config.maxEntries) {
      const oldestKey = this.findOldestEntry()
      if (oldestKey) {
        this.cache.delete(oldestKey)
      } else {
        break
      }
    }
  }

  /**
   * Find the oldest entry in the cache
   */
  private findOldestEntry(): CacheKey | null {
    let oldestKey: CacheKey | null = null
    let oldestTime = Number.POSITIVE_INFINITY

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt
        oldestKey = key
      }
    }

    return oldestKey
  }

  /**
   * Get weather data from cache
   * @returns Weather data or null if not found/expired
   */
  async get(lat: number, lon: number): Promise<WeatherData | null> {
    const key = this.generateKey(lat, lon)
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Store weather data in cache
   * @param useForecastTtl Use forecast TTL (1h) instead of current TTL (15min)
   */
  async set(
    lat: number,
    lon: number,
    data: WeatherData,
    useForecastTtl = false,
  ): Promise<void> {
    this.evictIfNeeded()

    const key = this.generateKey(lat, lon)
    const ttl = useForecastTtl
      ? this.config.forecastTtlMs
      : this.config.currentWeatherTtlMs
    const now = Date.now()

    this.cache.set(key, {
      data,
      expiresAt: now + ttl,
      createdAt: now,
    })
  }

  /**
   * Remove weather data from cache
   */
  async delete(lat: number, lon: number): Promise<boolean> {
    const key = this.generateKey(lat, lon)
    return this.cache.delete(key)
  }

  /**
   * Check if cache contains valid (non-expired) data for coordinates
   */
  async has(lat: number, lon: number): Promise<boolean> {
    const key = this.generateKey(lat, lon)
    const entry = this.cache.get(key)

    if (!entry) {
      return false
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Get remaining TTL in milliseconds for an entry
   * @returns TTL in ms, or 0 if not found/expired
   */
  async getTtl(lat: number, lon: number): Promise<number> {
    const key = this.generateKey(lat, lon)
    const entry = this.cache.get(key)

    if (!entry) {
      return 0
    }

    const remaining = entry.expiresAt - Date.now()
    return remaining > 0 ? remaining : 0
  }

  /**
   * Clear all entries from the cache
   */
  async clear(): Promise<void> {
    this.cache.clear()
  }

  /**
   * Get current cache size
   */
  async size(): Promise<number> {
    return this.cache.size
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<WeatherCacheStats> {
    return {
      size: this.cache.size,
      maxEntries: this.config.maxEntries,
      currentTtlMinutes: this.config.currentWeatherTtlMs / 60000,
      forecastTtlMinutes: this.config.forecastTtlMs / 60000,
    }
  }
}
