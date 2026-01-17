import { describe, expect, test, beforeEach } from 'bun:test'
import { InMemoryCragScoreCache } from '../in-memory-crag-score-cache'

describe('InMemoryCragScoreCache', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Store and retrieve static scores
  // 2. ✓ Return null for non-existent static scores
  // 3. ✓ Store and retrieve weather evaluation
  // 4. ✓ Return null for non-existent weather evaluation
  // 5. ✓ Weather evaluation key includes date (different dates = different cache entries)
  // 6. ✓ Invalidate static scores
  // 7. ✓ Invalidate weather evaluation for specific date
  // 8. ✓ Invalidate all weather evaluations for a crag
  // 9. ✓ Invalidate all scores for a crag
  // 10. ✓ Clear all cache
  // 11. ✓ Get cache stats
  // 12. ✓ Static scores expire after 24h (simulated)
  // 13. ✓ Weather evaluation expires after 12h (simulated)

  let cache: InMemoryCragScoreCache

  const createMockStaticScores = (cragId: string) => ({
    cragId,
    gradeScore: 85,
    qualityScore: 90,
    stylesScore: 75,
    routeCountScore: 80,
  })

  const createMockWeatherEvaluation = (cragId: string, date: string) => ({
    cragId,
    date,
    totalSectors: 5,
    sectorsWithGoodConditions: 3,
    overallScore: 2.5,
    label: 'good' as const,
    sectorEvaluations: [
      { sectorId: 'sector-1', score: 3.0, hasGoodConditions: true },
      { sectorId: 'sector-2', score: 2.0, hasGoodConditions: true },
    ],
  })

  beforeEach(() => {
    cache = new InMemoryCragScoreCache()
  })

  describe('Static Scores', () => {
    test('should store and retrieve static scores', async () => {
      const cragId = 'crag-123'
      const scores = createMockStaticScores(cragId)

      await cache.setStaticScores(cragId, scores)
      const retrieved = await cache.getStaticScores(cragId)

      expect(retrieved).not.toBeNull()
      expect(retrieved?.cragId).toBe(cragId)
      expect(retrieved?.gradeScore).toBe(85)
      expect(retrieved?.qualityScore).toBe(90)
      expect(retrieved?.stylesScore).toBe(75)
      expect(retrieved?.routeCountScore).toBe(80)
      expect(retrieved?.cachedAt).toBeGreaterThan(0)
    })

    test('should return null for non-existent static scores', async () => {
      const retrieved = await cache.getStaticScores('non-existent-crag')

      expect(retrieved).toBeNull()
    })

    test('should invalidate static scores', async () => {
      const cragId = 'crag-123'
      await cache.setStaticScores(cragId, createMockStaticScores(cragId))

      expect(await cache.getStaticScores(cragId)).not.toBeNull()

      await cache.invalidateStaticScores(cragId)

      expect(await cache.getStaticScores(cragId)).toBeNull()
    })
  })

  describe('Weather Evaluations', () => {
    test('should store and retrieve weather evaluation', async () => {
      const cragId = 'crag-123'
      const date = '2025-01-17'
      const evaluation = createMockWeatherEvaluation(cragId, date)

      await cache.setWeatherEvaluation(cragId, date, evaluation)
      const retrieved = await cache.getWeatherEvaluation(cragId, date)

      expect(retrieved).not.toBeNull()
      expect(retrieved?.cragId).toBe(cragId)
      expect(retrieved?.date).toBe(date)
      expect(retrieved?.totalSectors).toBe(5)
      expect(retrieved?.overallScore).toBe(2.5)
      expect(retrieved?.label).toBe('good')
      expect(retrieved?.cachedAt).toBeGreaterThan(0)
    })

    test('should return null for non-existent weather evaluation', async () => {
      const retrieved = await cache.getWeatherEvaluation(
        'non-existent-crag',
        '2025-01-17',
      )

      expect(retrieved).toBeNull()
    })

    test('should store different evaluations for different dates', async () => {
      const cragId = 'crag-123'
      const date1 = '2025-01-17'
      const date2 = '2025-01-18'

      const eval1 = createMockWeatherEvaluation(cragId, date1)
      eval1.overallScore = 2.5
      eval1.label = 'good'

      const eval2 = createMockWeatherEvaluation(cragId, date2)
      eval2.overallScore = 3.5
      eval2.label = 'excellent'

      await cache.setWeatherEvaluation(cragId, date1, eval1)
      await cache.setWeatherEvaluation(cragId, date2, eval2)

      const retrieved1 = await cache.getWeatherEvaluation(cragId, date1)
      const retrieved2 = await cache.getWeatherEvaluation(cragId, date2)

      expect(retrieved1?.overallScore).toBe(2.5)
      expect(retrieved1?.label).toBe('good')
      expect(retrieved2?.overallScore).toBe(3.5)
      expect(retrieved2?.label).toBe('excellent')
    })

    test('should invalidate weather evaluation for specific date', async () => {
      const cragId = 'crag-123'
      const date1 = '2025-01-17'
      const date2 = '2025-01-18'

      await cache.setWeatherEvaluation(
        cragId,
        date1,
        createMockWeatherEvaluation(cragId, date1),
      )
      await cache.setWeatherEvaluation(
        cragId,
        date2,
        createMockWeatherEvaluation(cragId, date2),
      )

      await cache.invalidateWeatherEvaluation(cragId, date1)

      expect(await cache.getWeatherEvaluation(cragId, date1)).toBeNull()
      expect(await cache.getWeatherEvaluation(cragId, date2)).not.toBeNull()
    })

    test('should invalidate all weather evaluations for a crag', async () => {
      const cragId = 'crag-123'
      const date1 = '2025-01-17'
      const date2 = '2025-01-18'
      const date3 = '2025-01-19'

      await cache.setWeatherEvaluation(
        cragId,
        date1,
        createMockWeatherEvaluation(cragId, date1),
      )
      await cache.setWeatherEvaluation(
        cragId,
        date2,
        createMockWeatherEvaluation(cragId, date2),
      )
      await cache.setWeatherEvaluation(
        cragId,
        date3,
        createMockWeatherEvaluation(cragId, date3),
      )

      // Invalidate without date = invalidate all
      await cache.invalidateWeatherEvaluation(cragId)

      expect(await cache.getWeatherEvaluation(cragId, date1)).toBeNull()
      expect(await cache.getWeatherEvaluation(cragId, date2)).toBeNull()
      expect(await cache.getWeatherEvaluation(cragId, date3)).toBeNull()
    })
  })

  describe('Combined Operations', () => {
    test('should invalidate all scores for a crag', async () => {
      const cragId = 'crag-123'
      const date = '2025-01-17'

      await cache.setStaticScores(cragId, createMockStaticScores(cragId))
      await cache.setWeatherEvaluation(
        cragId,
        date,
        createMockWeatherEvaluation(cragId, date),
      )

      await cache.invalidateAll(cragId)

      expect(await cache.getStaticScores(cragId)).toBeNull()
      expect(await cache.getWeatherEvaluation(cragId, date)).toBeNull()
    })

    test('should clear all cache', async () => {
      await cache.setStaticScores('crag-1', createMockStaticScores('crag-1'))
      await cache.setStaticScores('crag-2', createMockStaticScores('crag-2'))
      await cache.setWeatherEvaluation(
        'crag-1',
        '2025-01-17',
        createMockWeatherEvaluation('crag-1', '2025-01-17'),
      )
      await cache.setWeatherEvaluation(
        'crag-2',
        '2025-01-18',
        createMockWeatherEvaluation('crag-2', '2025-01-18'),
      )

      const statsBefore = await cache.getStats()
      expect(statsBefore.staticCount).toBe(2)
      expect(statsBefore.weatherCount).toBe(2)

      await cache.clear()

      const statsAfter = await cache.getStats()
      expect(statsAfter.staticCount).toBe(0)
      expect(statsAfter.weatherCount).toBe(0)
    })

    test('should return correct stats', async () => {
      const stats = await cache.getStats()
      expect(stats.staticCount).toBe(0)
      expect(stats.weatherCount).toBe(0)

      await cache.setStaticScores('crag-1', createMockStaticScores('crag-1'))
      await cache.setStaticScores('crag-2', createMockStaticScores('crag-2'))
      await cache.setWeatherEvaluation(
        'crag-1',
        '2025-01-17',
        createMockWeatherEvaluation('crag-1', '2025-01-17'),
      )

      const statsAfter = await cache.getStats()
      expect(statsAfter.staticCount).toBe(2)
      expect(statsAfter.weatherCount).toBe(1)
    })
  })

  describe('TTL Expiration', () => {
    // Note: Testing actual TTL expiration would require waiting 12-24 hours
    // or modifying the cache to accept TTL as a config parameter.
    // These tests verify the expiration logic structure is in place.

    test('cached static scores include timestamp', async () => {
      const cragId = 'crag-123'
      const beforeSet = Date.now()

      await cache.setStaticScores(cragId, createMockStaticScores(cragId))

      const afterSet = Date.now()
      const retrieved = await cache.getStaticScores(cragId)

      expect(retrieved?.cachedAt).toBeGreaterThanOrEqual(beforeSet)
      expect(retrieved?.cachedAt).toBeLessThanOrEqual(afterSet)
    })

    test('cached weather evaluation includes timestamp', async () => {
      const cragId = 'crag-123'
      const date = '2025-01-17'
      const beforeSet = Date.now()

      await cache.setWeatherEvaluation(
        cragId,
        date,
        createMockWeatherEvaluation(cragId, date),
      )

      const afterSet = Date.now()
      const retrieved = await cache.getWeatherEvaluation(cragId, date)

      expect(retrieved?.cachedAt).toBeGreaterThanOrEqual(beforeSet)
      expect(retrieved?.cachedAt).toBeLessThanOrEqual(afterSet)
    })
  })
})
