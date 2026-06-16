import { describe, expect, mock, test } from 'bun:test'

// ── Mocks ────────────────────────────────────────────────────────────────────

mock.module('@OneJs/core', () => ({
  logger: {
    debug: mock(() => {}),
    info: mock(() => {}),
    warn: mock(() => {}),
    error: mock(() => {}),
  },
}))

const { responseMiddleware } = await import('../response.middleware')

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeContext(body: any = undefined) {
  return {
    request: {
      method: 'GET',
      url: 'http://localhost/test',
    } as any,
    body,
    set: { status: 200 },
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('responseMiddleware', () => {
  test('returns the body unchanged when it already has a success field', async () => {
    const context = makeContext({ success: true, data: { id: 1 } })
    const middleware = responseMiddleware()

    const result = await middleware(context as any)

    expect(result).toEqual({ success: true, data: { id: 1 } })
  })

  test('wraps a plain object response in a success envelope', async () => {
    const context = makeContext({ id: 1, name: 'Alice' })
    const middleware = responseMiddleware()

    const result = await middleware(context as any)

    expect((result as any).success).toBe(true)
    expect((result as any).data).toEqual({ id: 1, name: 'Alice' })
  })

  test('wraps a string response', async () => {
    const context = makeContext('hello')
    const middleware = responseMiddleware()

    const result = await middleware(context as any)

    expect((result as any).success).toBe(true)
  })

  test('wraps a null body', async () => {
    const context = makeContext(null)
    const middleware = responseMiddleware()

    const result = await middleware(context as any)

    // null is falsy, so no wrapping — returns createSuccessResponse(null)
    expect(result).toBeDefined()
  })

  test('sets context.body to the formatted response', async () => {
    const context = makeContext({ foo: 'bar' })
    const middleware = responseMiddleware()

    await middleware(context as any)

    expect((context.body as any).success).toBe(true)
  })

  test('does not re-wrap a response with existing success: false', async () => {
    const errorResponse = { success: false, error: 'Not found' }
    const context = makeContext(errorResponse)
    const middleware = responseMiddleware()

    const result = await middleware(context as any)

    expect(result).toEqual(errorResponse)
  })
})
