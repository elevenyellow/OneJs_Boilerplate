import { describe, expect, test, beforeEach } from 'bun:test'
import type { WeatherData } from '../../../domain/entities/weather-response.entity'
import { InMemoryWeatherCache } from '../in-memory-weather-cache'

describe('InMemoryWeatherCache', () => {
  let cache: InMemoryWeatherCache

  const createMockWeatherData = (temperature = 15): WeatherData => ({
    metadata: {
      location: 'Test Location',
      coordinates: { lat: 40, lon: -3 },
      timezone: 'UTC',
      lastUpdate: new Date(),
      generationTimeMs: 100,
    },
    current: {
      timestamp: new Date(),
      temperature,
      windSpeed: 10,
      weatherCode: 1,
      isDaylight: true,
    },
    hourly: [],
    daily: [],
  })

  beforeEach(() => {
    cache = new InMemoryWeatherCache()
  })

  describe('set and get', () => {
    test('should store and retrieve weather data', async () => {
      const data = createMockWeatherData()
      await cache.set(40.0, -3.0, data)

      const retrieved = await cache.get(40.0, -3.0)

      expect(retrieved).not.toBeNull()
      expect(retrieved?.current.temperature).toBe(15)
    })

    test('should return null for non-existent data', async () => {
      const retrieved = await cache.get(50.0, 10.0)

      expect(retrieved).toBeNull()
    })

    test('should round coordinates based on precision', async () => {
      const data = createMockWeatherData()

      // Store at precise coordinates
      await cache.set(40.123456, -3.654321, data)

      // Should be retrievable with slightly different coordinates (within precision)
      const retrieved = await cache.get(40.12, -3.65)

      expect(retrieved).not.toBeNull()
    })
  })

  describe('TTL expiration', () => {
    test('should expire data after TTL', async () => {
      // Create cache with very short TTL
      const shortCache = new InMemoryWeatherCache({
        currentWeatherTtlMs: 50, // 50ms TTL
      })

      const data = createMockWeatherData()
      await shortCache.set(40.0, -3.0, data)

      // Should be available immediately
      expect(await shortCache.get(40.0, -3.0)).not.toBeNull()

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 60))

      // Should be expired
      expect(await shortCache.get(40.0, -3.0)).toBeNull()
    })
  })

  describe('delete', () => {
    test('should delete cached data', async () => {
      const data = createMockWeatherData()
      await cache.set(40.0, -3.0, data)

      expect(await cache.get(40.0, -3.0)).not.toBeNull()

      const deleted = await cache.delete(40.0, -3.0)

      expect(deleted).toBe(true)
      expect(await cache.get(40.0, -3.0)).toBeNull()
    })

    test('should return false when deleting non-existent data', async () => {
      const deleted = await cache.delete(50.0, 10.0)

      expect(deleted).toBe(false)
    })
  })

  describe('has', () => {
    test('should return true for cached data', async () => {
      const data = createMockWeatherData()
      await cache.set(40.0, -3.0, data)

      expect(await cache.has(40.0, -3.0)).toBe(true)
    })

    test('should return false for non-existent data', async () => {
      expect(await cache.has(50.0, 10.0)).toBe(false)
    })

    test('should return false for expired data', async () => {
      const shortCache = new InMemoryWeatherCache({
        currentWeatherTtlMs: 50,
      })

      const data = createMockWeatherData()
      await shortCache.set(40.0, -3.0, data)

      await new Promise((resolve) => setTimeout(resolve, 60))

      expect(await shortCache.has(40.0, -3.0)).toBe(false)
    })
  })

  describe('getTtl', () => {
    test('should return remaining TTL', async () => {
      const data = createMockWeatherData()
      await cache.set(40.0, -3.0, data)

      const ttl = await cache.getTtl(40.0, -3.0)

      // Should be close to 15 minutes (900000ms)
      expect(ttl).toBeGreaterThan(890000)
      expect(ttl).toBeLessThanOrEqual(900000)
    })

    test('should return 0 for non-existent data', async () => {
      const ttl = await cache.getTtl(50.0, 10.0)

      expect(ttl).toBe(0)
    })
  })

  describe('clear', () => {
    test('should clear all cached data', async () => {
      const data = createMockWeatherData()
      await cache.set(40.0, -3.0, data)
      await cache.set(50.0, 10.0, data)

      expect(await cache.size()).toBe(2)

      await cache.clear()

      expect(await cache.size()).toBe(0)
      expect(await cache.get(40.0, -3.0)).toBeNull()
      expect(await cache.get(50.0, 10.0)).toBeNull()
    })
  })

  describe('size', () => {
    test('should return correct cache size', async () => {
      expect(await cache.size()).toBe(0)

      const data = createMockWeatherData()
      await cache.set(40.0, -3.0, data)

      expect(await cache.size()).toBe(1)

      await cache.set(50.0, 10.0, data)

      expect(await cache.size()).toBe(2)
    })
  })

  describe('max entries eviction', () => {
    test('should evict oldest entry when max entries reached', async () => {
      const smallCache = new InMemoryWeatherCache({
        maxEntries: 2,
      })

      const data1 = createMockWeatherData(10)
      const data2 = createMockWeatherData(20)
      const data3 = createMockWeatherData(30)

      await smallCache.set(40.0, -3.0, data1)
      await smallCache.set(50.0, 10.0, data2)

      expect(await smallCache.size()).toBe(2)

      // Adding third entry should evict first one
      await smallCache.set(60.0, 20.0, data3)

      expect(await smallCache.size()).toBe(2)
      expect(await smallCache.get(40.0, -3.0)).toBeNull() // Evicted
      expect(await smallCache.get(50.0, 10.0)).not.toBeNull()
      expect(await smallCache.get(60.0, 20.0)).not.toBeNull()
    })
  })

  describe('getStats', () => {
    test('should return correct stats', async () => {
      const stats = await cache.getStats()

      expect(stats.size).toBe(0)
      expect(stats.maxEntries).toBe(1000)
      expect(stats.currentTtlMinutes).toBe(15)
      expect(stats.forecastTtlMinutes).toBe(60)
    })
  })

  describe('forecast TTL', () => {
    test('should use forecast TTL when specified', async () => {
      const data = createMockWeatherData()
      await cache.set(40.0, -3.0, data, true) // Use forecast TTL

      const ttl = await cache.getTtl(40.0, -3.0)

      // Should be close to 60 minutes (3600000ms)
      expect(ttl).toBeGreaterThan(3590000)
      expect(ttl).toBeLessThanOrEqual(3600000)
    })
  })
})
