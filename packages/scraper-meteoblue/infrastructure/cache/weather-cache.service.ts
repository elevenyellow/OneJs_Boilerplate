import { ConfigService, Inject, Injectable, Logger } from '@OneJs/core'
import type { ZoneWeatherDto } from '../../domain/dtos/weather-data.dto'

// Dynamic import of ioredis to avoid build errors when not installed
type IORedisType = typeof import('ioredis').default
let IORedis: IORedisType | null = null
try {
  IORedis = (await import('ioredis')).default
} catch {
  // ioredis not available, will use in-memory cache
}

const DEFAULT_TTL_SECONDS = 3 * 60 * 60 // 3 hours

@Injectable()
export class WeatherCacheService {
  private redis: InstanceType<IORedisType> | null = null
  private readonly ttlSeconds: number
  private readonly inMemoryCache: Map<
    string,
    { data: ZoneWeatherDto; expiresAt: number }
  >

  constructor(
    @Inject(ConfigService)
    private readonly config: ConfigService,
    @Inject(Logger)
    private readonly logger: Logger,
  ) {
    this.ttlSeconds = parseInt(
      config.get('WEATHER_CACHE_TTL_SECONDS') || String(DEFAULT_TTL_SECONDS),
      10,
    )
    this.inMemoryCache = new Map()

    const redisUrl = config.get('REDIS_URL')
    if (redisUrl && IORedis) {
      try {
        this.redis = new IORedis(redisUrl, {
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        })
        this.redis.on('error', (err: Error) => {
          this.logger.warn('cache:weather', `Redis error: ${err.message}`)
        })
        this.logger.debug('cache:weather', 'Redis cache initialized')
      } catch (error) {
        this.logger.warn(
          'cache:weather',
          'Failed to connect to Redis, using in-memory cache',
        )
        this.redis = null
      }
    } else {
      this.logger.debug(
        'cache:weather',
        'No REDIS_URL configured or ioredis not available, using in-memory cache',
      )
      this.redis = null
    }
  }

  /**
   * Get cached weather data
   */
  async get(key: string): Promise<ZoneWeatherDto | null> {
    try {
      if (this.redis) {
        const data = await this.redis.get(key)
        if (data) {
          return this.deserialize(data)
        }
      } else {
        // In-memory fallback
        const cached = this.inMemoryCache.get(key)
        if (cached && cached.expiresAt > Date.now()) {
          return cached.data
        }
        // Clean up expired entry
        if (cached) {
          this.inMemoryCache.delete(key)
        }
      }
    } catch (error) {
      this.logger.warn(
        'cache:weather',
        `Cache get error: ${(error as Error).message}`,
      )
    }
    return null
  }

  /**
   * Set cached weather data
   */
  async set(key: string, data: ZoneWeatherDto): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.setex(key, this.ttlSeconds, this.serialize(data))
      } else {
        // In-memory fallback
        this.inMemoryCache.set(key, {
          data,
          expiresAt: Date.now() + this.ttlSeconds * 1000,
        })
        // Limit in-memory cache size
        if (this.inMemoryCache.size > 1000) {
          this.cleanupInMemoryCache()
        }
      }
    } catch (error) {
      this.logger.warn(
        'cache:weather',
        `Cache set error: ${(error as Error).message}`,
      )
    }
  }

  /**
   * Invalidate cached entry
   */
  async invalidate(key: string): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.del(key)
      } else {
        this.inMemoryCache.delete(key)
      }
    } catch (error) {
      this.logger.warn(
        'cache:weather',
        `Cache invalidate error: ${(error as Error).message}`,
      )
    }
  }

  /**
   * Invalidate all cached weather for a zone
   */
  async invalidateZone(zoneId: string): Promise<void> {
    const pattern = `weather:${zoneId}:*`
    try {
      if (this.redis) {
        const keys = await this.redis.keys(pattern)
        if (keys.length > 0) {
          await this.redis.del(...keys)
        }
      } else {
        for (const key of this.inMemoryCache.keys()) {
          if (key.startsWith(`weather:${zoneId}:`)) {
            this.inMemoryCache.delete(key)
          }
        }
      }
    } catch (error) {
      this.logger.warn(
        'cache:weather',
        `Cache invalidate zone error: ${(error as Error).message}`,
      )
    }
  }

  private serialize(data: ZoneWeatherDto): string {
    return JSON.stringify(data)
  }

  private deserialize(data: string): ZoneWeatherDto {
    const parsed = JSON.parse(data)
    // Restore Date objects
    parsed.fetchedAt = new Date(parsed.fetchedAt)
    parsed.daily = parsed.daily.map((d: any) => ({
      ...d,
      date: new Date(d.date),
    }))
    parsed.hourly = parsed.hourly.map((h: any) => ({
      ...h,
      date: new Date(h.date),
    }))
    return parsed
  }

  private cleanupInMemoryCache(): void {
    const now = Date.now()
    for (const [key, value] of this.inMemoryCache.entries()) {
      if (value.expiresAt < now) {
        this.inMemoryCache.delete(key)
      }
    }
    // If still too large, remove oldest entries
    if (this.inMemoryCache.size > 800) {
      const entries = Array.from(this.inMemoryCache.entries()).sort(
        (a, b) => a[1].expiresAt - b[1].expiresAt,
      )
      const toRemove = entries.slice(0, 200)
      for (const [key] of toRemove) {
        this.inMemoryCache.delete(key)
      }
    }
  }
}
