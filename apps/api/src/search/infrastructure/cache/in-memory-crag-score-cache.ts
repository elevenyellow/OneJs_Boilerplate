import { Injectable } from '@OneJs/core'
import type {
  ICragScoreCache,
  CachedStaticScores,
  CachedWeatherEvaluation,
  CragScoreCacheStats,
} from '../../domain/ports/crag-score-cache.port'

/**
 * TTL for static scores: 24 hours
 * Static scores (grade, quality, styles, route count) rarely change
 */
const STATIC_SCORES_TTL_MS = 24 * 60 * 60 * 1000

/**
 * TTL for weather evaluations: 12 hours
 * Weather conditions can change, but not as frequently as real-time weather
 */
const WEATHER_EVAL_TTL_MS = 12 * 60 * 60 * 1000

/**
 * In-memory implementation of crag score cache.
 *
 * Implements ICragScoreCache interface for easy swap to Redis in production.
 *
 * Two-tier caching:
 * 1. Static scores (TTL: 24h) - stored by cragId
 * 2. Weather evaluations (TTL: 12h) - stored by cragId:date
 *
 * Features:
 * - TTL-based expiration
 * - Automatic cleanup of expired entries on access
 * - Separate storage for static vs weather scores
 */
@Injectable()
export class InMemoryCragScoreCache implements ICragScoreCache {
  private staticScores = new Map<string, CachedStaticScores>()
  private weatherEvaluations = new Map<string, CachedWeatherEvaluation>()

  /**
   * Generate key for weather evaluation cache
   * Format: cragId:date (e.g., "abc123:2025-01-17")
   */
  private getWeatherKey(cragId: string, date: string): string {
    return `${cragId}:${date}`
  }

  /**
   * Check if static scores entry is expired
   */
  private isStaticExpired(entry: CachedStaticScores): boolean {
    return Date.now() - entry.cachedAt > STATIC_SCORES_TTL_MS
  }

  /**
   * Check if weather evaluation entry is expired
   */
  private isWeatherExpired(entry: CachedWeatherEvaluation): boolean {
    return Date.now() - entry.cachedAt > WEATHER_EVAL_TTL_MS
  }

  // Static scores methods

  async getStaticScores(cragId: string): Promise<CachedStaticScores | null> {
    const cached = this.staticScores.get(cragId)

    if (!cached) {
      return null
    }

    if (this.isStaticExpired(cached)) {
      this.staticScores.delete(cragId)
      return null
    }

    return cached
  }

  async setStaticScores(
    cragId: string,
    scores: Omit<CachedStaticScores, 'cachedAt'>,
  ): Promise<void> {
    this.staticScores.set(cragId, {
      ...scores,
      cachedAt: Date.now(),
    })
  }

  // Weather evaluation methods

  async getWeatherEvaluation(
    cragId: string,
    date: string,
  ): Promise<CachedWeatherEvaluation | null> {
    const key = this.getWeatherKey(cragId, date)
    const cached = this.weatherEvaluations.get(key)

    if (!cached) {
      return null
    }

    if (this.isWeatherExpired(cached)) {
      this.weatherEvaluations.delete(key)
      return null
    }

    return cached
  }

  async setWeatherEvaluation(
    cragId: string,
    date: string,
    evaluation: Omit<CachedWeatherEvaluation, 'cachedAt'>,
  ): Promise<void> {
    const key = this.getWeatherKey(cragId, date)
    this.weatherEvaluations.set(key, {
      ...evaluation,
      cachedAt: Date.now(),
    })
  }

  // Invalidation methods

  async invalidateStaticScores(cragId: string): Promise<void> {
    this.staticScores.delete(cragId)
  }

  async invalidateWeatherEvaluation(
    cragId: string,
    date?: string,
  ): Promise<void> {
    if (date) {
      // Invalidate specific date
      this.weatherEvaluations.delete(this.getWeatherKey(cragId, date))
    } else {
      // Invalidate all dates for this crag
      const keysToDelete: string[] = []

      for (const key of this.weatherEvaluations.keys()) {
        if (key.startsWith(`${cragId}:`)) {
          keysToDelete.push(key)
        }
      }

      for (const key of keysToDelete) {
        this.weatherEvaluations.delete(key)
      }
    }
  }

  async invalidateAll(cragId: string): Promise<void> {
    await this.invalidateStaticScores(cragId)
    await this.invalidateWeatherEvaluation(cragId)
  }

  // Utility methods

  async clear(): Promise<void> {
    this.staticScores.clear()
    this.weatherEvaluations.clear()
  }

  async getStats(): Promise<CragScoreCacheStats> {
    // Clean up expired entries before reporting stats
    this.cleanupExpired()

    return {
      staticCount: this.staticScores.size,
      weatherCount: this.weatherEvaluations.size,
    }
  }

  /**
   * Clean up expired entries from both caches
   */
  private cleanupExpired(): void {
    const now = Date.now()

    // Cleanup static scores
    for (const [key, entry] of this.staticScores.entries()) {
      if (now - entry.cachedAt > STATIC_SCORES_TTL_MS) {
        this.staticScores.delete(key)
      }
    }

    // Cleanup weather evaluations
    for (const [key, entry] of this.weatherEvaluations.entries()) {
      if (now - entry.cachedAt > WEATHER_EVAL_TTL_MS) {
        this.weatherEvaluations.delete(key)
      }
    }
  }
}
