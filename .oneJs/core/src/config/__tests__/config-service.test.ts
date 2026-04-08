import { describe, test, expect, mock, afterEach } from 'bun:test'
import * as path from 'path'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockLogger = {
  debug: mock(() => {}),
  info: mock(() => {}),
  warn: mock(() => {}),
  error: mock(() => {}),
}

// Default: no .env files in directory
let mockEnvFiles: string[] = []
let mockFileContents: Record<string, string> = {}

mock.module('fs', () => ({
  default: {
    readdirSync: mock((_dir: string) => mockEnvFiles),
    readFileSync: mock((filePath: string, _enc: string) => {
      const file = path.basename(filePath)
      return mockFileContents[file] ?? ''
    }),
  },
  readdirSync: mock((_dir: string) => mockEnvFiles),
  readFileSync: mock((filePath: string, _enc: string) => {
    const file = path.basename(filePath)
    return mockFileContents[file] ?? ''
  }),
}))

const { ConfigService } = await import('../config-service')

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeService() {
  return new ConfigService(mockLogger as any)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ConfigService', () => {
  afterEach(() => {
    mockEnvFiles = []
    mockFileContents = {}
  })

  describe('get()', () => {
    test('returns process.env values', () => {
      process.env.__TEST_VAR__ = 'hello'
      const service = makeService()

      expect(service.get('__TEST_VAR__')).toBe('hello')

      delete process.env.__TEST_VAR__
    })

    test('returns undefined for unknown keys', () => {
      const service = makeService()

      expect(service.get('NONEXISTENT_KEY_XYZ')).toBeUndefined()
    })
  })

  describe('loadEnvFiles()', () => {
    test('logs success after loading env files', () => {
      mockLogger.info.mockClear()
      makeService()

      expect(mockLogger.info).toHaveBeenCalledWith(
        'OneJs:config',
        'All .env files from root loaded successfully.',
      )
    })

    test('parses KEY=VALUE from .env file', () => {
      mockEnvFiles = ['app.env']
      mockFileContents['app.env'] = 'MY_SECRET=abc123'

      const service = makeService()

      expect(service.get('MY_SECRET')).toBe('abc123')
    })

    test('strips single quotes from values', () => {
      mockEnvFiles = ['app.env']
      mockFileContents['app.env'] = "DB_PASS='secret'"

      const service = makeService()

      expect(service.get('DB_PASS')).toBe('secret')
    })

    test('strips double quotes from values', () => {
      mockEnvFiles = ['app.env']
      mockFileContents['app.env'] = 'API_KEY="my-key"'

      const service = makeService()

      expect(service.get('API_KEY')).toBe('my-key')
    })

    test('skips lines without an = separator', () => {
      mockEnvFiles = ['app.env']
      mockFileContents['app.env'] = '# comment\nVALID_KEY=valid'

      const service = makeService()

      expect(service.get('VALID_KEY')).toBe('valid')
    })

    test('skips lines with empty key or value', () => {
      mockEnvFiles = ['app.env']
      mockFileContents['app.env'] = '=nokey\nNOVAL='

      const service = makeService()

      expect(service.get('')).toBeUndefined()
      expect(service.get('NOVAL')).toBeUndefined()
    })

    test('handles values containing = sign correctly', () => {
      mockEnvFiles = ['app.env']
      mockFileContents['app.env'] = 'ENCODED=abc=def=ghi'

      const service = makeService()

      expect(service.get('ENCODED')).toBe('abc=def=ghi')
    })

    test('loads multiple .env files', () => {
      mockEnvFiles = ['app.env', 'secrets.env']
      mockFileContents['app.env'] = 'VAR_A=value-a'
      mockFileContents['secrets.env'] = 'VAR_B=value-b'

      const service = makeService()

      expect(service.get('VAR_A')).toBe('value-a')
      expect(service.get('VAR_B')).toBe('value-b')
    })

    test('only loads files ending in .env', () => {
      mockEnvFiles = ['app.env', 'notes.txt', 'config.json']
      mockFileContents['app.env'] = 'FROM_ENV=yes'

      const service = makeService()

      expect(service.get('FROM_ENV')).toBe('yes')
    })
  })
})
