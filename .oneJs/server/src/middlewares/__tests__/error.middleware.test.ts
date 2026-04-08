import { describe, expect, it, mock, beforeAll } from 'bun:test'
import { OneJsError } from '@OneJs/core'

// Silence logger output during tests
import { logger } from '@OneJs/core'
const originalError = logger.error.bind(logger)
beforeAll(() => { logger.error = mock(() => {}) as any })

import { createErrorHandler } from '.././error.middleware'

describe('createErrorHandler()', () => {
  const handler = createErrorHandler()

  it('returns a 500 response for generic errors', () => {
    const set = { status: 200 }
    const result = handler({
      code: 'UNKNOWN',
      error: new Error('something broke'),
      set,
    })

    expect(set.status).toBe(500)
    expect(result.success).toBe(false)
  })

  it('uses the OneJsError statusCode for OneJsError instances', () => {
    const set = { status: 200 }
    const error = new OneJsError('Not Found', 404, 'Item not found')
    const result = handler({ code: 'NOT_FOUND', error, set })

    expect(set.status).toBe(404)
    expect(result.success).toBe(false)
    expect(result.message).toBe('Not Found')
  })

  it('includes explanatory details in development mode', () => {
    const original = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    const set = { status: 200 }
    const error = new OneJsError('Bad', 400, 'Missing field')
    const result = handler({ code: 'VALIDATION', error, set })

    expect(result.error.details).toBe('Missing field')
    process.env.NODE_ENV = original
  })

  it('includes a timestamp', () => {
    const set = { status: 200 }
    const result = handler({ code: 'ERR', error: new Error('x'), set })

    expect(typeof result.timestamp).toBe('string')
    expect(() => new Date(result.timestamp)).not.toThrow()
  })
})
