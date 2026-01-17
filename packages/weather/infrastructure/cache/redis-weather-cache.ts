import { Injectable } from '@OneJs/core'
import type { WeatherData } from '../../domain/entities/weather-response.entity'
import type {
  IWeatherCache,
  WeatherCacheStats,
} from '../../domain/ports/weather-cache.port'

/**
 * Redis-based weather cache for production.
 *
 * This is a stub implementation that will be completed when Redis is configured.
 * It implements IWeatherCache interface for easy swap from InMemoryWeatherCache.
 *
 * Key pattern: weather:{lat}:{lon}
 * TTL: Configurable per entry type (current vs forecast)
 *
 * TODO: Implement when Redis is configured for production
 */
@Injectable()
export class RedisWeatherCache implements IWeatherCache {
  constructor() {
    // Redis client will be injected when available:
    // @Inject(RedisClient) private readonly redis: RedisClient
  }

  async get(_lat: number, _lon: number): Promise<WeatherData | null> {
    throw new Error(
      'RedisWeatherCache not implemented. Use InMemoryWeatherCache for development.',
    )
  }

  async set(
    _lat: number,
    _lon: number,
    _data: WeatherData,
    _useForecastTtl?: boolean,
  ): Promise<void> {
    throw new Error(
      'RedisWeatherCache not implemented. Use InMemoryWeatherCache for development.',
    )
  }

  async delete(_lat: number, _lon: number): Promise<boolean> {
    throw new Error(
      'RedisWeatherCache not implemented. Use InMemoryWeatherCache for development.',
    )
  }

  async has(_lat: number, _lon: number): Promise<boolean> {
    throw new Error(
      'RedisWeatherCache not implemented. Use InMemoryWeatherCache for development.',
    )
  }

  async getTtl(_lat: number, _lon: number): Promise<number> {
    throw new Error(
      'RedisWeatherCache not implemented. Use InMemoryWeatherCache for development.',
    )
  }

  async clear(): Promise<void> {
    throw new Error(
      'RedisWeatherCache not implemented. Use InMemoryWeatherCache for development.',
    )
  }

  async size(): Promise<number> {
    throw new Error(
      'RedisWeatherCache not implemented. Use InMemoryWeatherCache for development.',
    )
  }

  async getStats(): Promise<WeatherCacheStats> {
    throw new Error(
      'RedisWeatherCache not implemented. Use InMemoryWeatherCache for development.',
    )
  }
}
