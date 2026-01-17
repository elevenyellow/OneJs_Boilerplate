import { Injectable } from '@OneJs/core'
import type {
  ICragScoreCache,
  CachedStaticScores,
  CachedWeatherEvaluation,
  CragScoreCacheStats,
} from '../../domain/ports/crag-score-cache.port'

/**
 * Redis-based crag score cache for production.
 *
 * This is a stub implementation that will be completed when Redis is configured.
 * It implements ICragScoreCache interface for easy swap from InMemoryCragScoreCache.
 *
 * Key patterns:
 * - Static: crag:{cragId}:static (TTL: 24h)
 * - Weather: crag:{cragId}:weather:{date} (TTL: 12h)
 *
 * TODO: Implement when Redis is configured for production
 */
@Injectable()
export class RedisCragScoreCache implements ICragScoreCache {
  constructor() {
    // Redis client will be injected when available:
    // @Inject(RedisClient) private readonly redis: RedisClient
  }

  async getStaticScores(_cragId: string): Promise<CachedStaticScores | null> {
    throw new Error(
      'RedisCragScoreCache not implemented. Use InMemoryCragScoreCache for development.',
    )
  }

  async setStaticScores(
    _cragId: string,
    _scores: Omit<CachedStaticScores, 'cachedAt'>,
  ): Promise<void> {
    throw new Error(
      'RedisCragScoreCache not implemented. Use InMemoryCragScoreCache for development.',
    )
  }

  async getWeatherEvaluation(
    _cragId: string,
    _date: string,
  ): Promise<CachedWeatherEvaluation | null> {
    throw new Error(
      'RedisCragScoreCache not implemented. Use InMemoryCragScoreCache for development.',
    )
  }

  async setWeatherEvaluation(
    _cragId: string,
    _date: string,
    _evaluation: Omit<CachedWeatherEvaluation, 'cachedAt'>,
  ): Promise<void> {
    throw new Error(
      'RedisCragScoreCache not implemented. Use InMemoryCragScoreCache for development.',
    )
  }

  async invalidateStaticScores(_cragId: string): Promise<void> {
    throw new Error(
      'RedisCragScoreCache not implemented. Use InMemoryCragScoreCache for development.',
    )
  }

  async invalidateWeatherEvaluation(
    _cragId: string,
    _date?: string,
  ): Promise<void> {
    throw new Error(
      'RedisCragScoreCache not implemented. Use InMemoryCragScoreCache for development.',
    )
  }

  async invalidateAll(_cragId: string): Promise<void> {
    throw new Error(
      'RedisCragScoreCache not implemented. Use InMemoryCragScoreCache for development.',
    )
  }

  async clear(): Promise<void> {
    throw new Error(
      'RedisCragScoreCache not implemented. Use InMemoryCragScoreCache for development.',
    )
  }

  async getStats(): Promise<CragScoreCacheStats> {
    throw new Error(
      'RedisCragScoreCache not implemented. Use InMemoryCragScoreCache for development.',
    )
  }
}
