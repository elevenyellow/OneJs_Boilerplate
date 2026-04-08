import { describe, test, expect, mock } from 'bun:test'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockIORedisConstructor = mock((url: string, opts: any) => ({
  _url: url,
  _opts: opts,
}))

mock.module('ioredis', () => ({
  default: function MockIORedis(url: string, opts: any) {
    return mockIORedisConstructor(url, opts)
  },
}))

const { RedisService } = await import('../redis')

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeConfig(redisUrl: string | undefined) {
  return {
    get: mock((key: string) => (key === 'REDIS_URL' ? redisUrl : undefined)),
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('RedisService', () => {
  test('throws when REDIS_URL is not defined', () => {
    expect(() => new RedisService(makeConfig(undefined) as any)).toThrow(
      'REDIS_URL is not defined',
    )
  })

  test('creates IORedis connection with the provided URL', () => {
    mockIORedisConstructor.mockClear()

    new RedisService(makeConfig('redis://localhost:6379') as any)

    expect(mockIORedisConstructor).toHaveBeenCalledTimes(1)
    const [url] = mockIORedisConstructor.mock.calls[0] as any
    expect(url).toBe('redis://localhost:6379')
  })

  test('passes maxRetriesPerRequest: null to IORedis', () => {
    mockIORedisConstructor.mockClear()

    new RedisService(makeConfig('redis://localhost:6379') as any)

    const [, opts] = mockIORedisConstructor.mock.calls[0] as any
    expect(opts.maxRetriesPerRequest).toBeNull()
  })

  test('exposes the created connection as .connection', () => {
    const service = new RedisService(
      makeConfig('redis://localhost:6379') as any,
    )

    expect(service.connection).toBeDefined()
  })
})
