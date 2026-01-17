/**
 * Cached static scores for a crag (independent of user location and date).
 * These scores are based on crag attributes that rarely change.
 */
export interface CachedStaticScores {
  cragId: string
  gradeScore: number
  qualityScore: number
  stylesScore: number
  routeCountScore: number
  cachedAt: number
}

/**
 * Individual sector evaluation within a crag
 */
export interface SectorEvaluation {
  sectorId: string
  score: number
  hasGoodConditions: boolean
}

/**
 * Weather condition label for UI display
 */
export type WeatherConditionLabel = 'excellent' | 'good' | 'fair' | 'poor'

/**
 * Cached weather evaluation for a crag on a specific date.
 * These evaluations consider weather conditions and sector orientations.
 */
export interface CachedWeatherEvaluation {
  cragId: string
  date: string // ISO date format: "2025-01-17"
  totalSectors: number
  sectorsWithGoodConditions: number
  overallScore: number
  label: WeatherConditionLabel
  sectorEvaluations: SectorEvaluation[]
  cachedAt: number
}

/**
 * Cache statistics for monitoring
 */
export interface CragScoreCacheStats {
  staticCount: number
  weatherCount: number
}

/**
 * Port for crag scoring cache.
 * Allows swapping implementations (in-memory for dev, Redis for production).
 *
 * Two-tier caching:
 * 1. Static scores (TTL: 24h) - grade, quality, styles, route count
 * 2. Weather evaluations (TTL: 12h, per date) - conditions for specific query dates
 *
 * Key patterns:
 * - Static: crag:{cragId}:static
 * - Weather: crag:{cragId}:weather:{date}
 */
export interface ICragScoreCache {
  // Static scores (TTL: 24h)

  /**
   * Get cached static scores for a crag
   */
  getStaticScores(cragId: string): Promise<CachedStaticScores | null>

  /**
   * Set cached static scores for a crag
   */
  setStaticScores(
    cragId: string,
    scores: Omit<CachedStaticScores, 'cachedAt'>,
  ): Promise<void>

  // Weather evaluation per date (TTL: 12h)

  /**
   * Get cached weather evaluation for a crag on a specific date
   */
  getWeatherEvaluation(
    cragId: string,
    date: string,
  ): Promise<CachedWeatherEvaluation | null>

  /**
   * Set cached weather evaluation for a crag on a specific date
   */
  setWeatherEvaluation(
    cragId: string,
    date: string,
    evaluation: Omit<CachedWeatherEvaluation, 'cachedAt'>,
  ): Promise<void>

  // Invalidation

  /**
   * Invalidate static scores for a crag
   */
  invalidateStaticScores(cragId: string): Promise<void>

  /**
   * Invalidate weather evaluation for a crag
   * @param date If provided, only invalidate that date. Otherwise, invalidate all dates.
   */
  invalidateWeatherEvaluation(cragId: string, date?: string): Promise<void>

  /**
   * Invalidate all cached data for a crag (static + all weather)
   */
  invalidateAll(cragId: string): Promise<void>

  // Utilities

  /**
   * Clear all cache entries
   */
  clear(): Promise<void>

  /**
   * Get cache statistics
   */
  getStats(): Promise<CragScoreCacheStats>
}
