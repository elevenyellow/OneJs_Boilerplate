import { describe, expect, it } from 'bun:test'
import { createSuccessResponse, createErrorResponse } from '.././response'

describe('createSuccessResponse()', () => {
  it('wraps data in a success envelope', () => {
    const res = createSuccessResponse({ items: [1, 2, 3] })

    expect(res.success).toBe(true)
    expect(res.message).toBe('Success')
    expect(res.data).toEqual({ items: [1, 2, 3] })
    expect(typeof res.timestamp).toBe('string')
  })

  it('accepts a custom message', () => {
    const res = createSuccessResponse(null, 'Created')
    expect(res.message).toBe('Created')
  })

  it('generates a valid ISO timestamp', () => {
    const res = createSuccessResponse({})
    expect(() => new Date(res.timestamp)).not.toThrow()
  })
})

describe('createErrorResponse()', () => {
  it('wraps error details in an error envelope', () => {
    const res = createErrorResponse('Validation failed', 400, 'Title is required')

    expect(res.success).toBe(false)
    expect(res.message).toBe('Validation failed')
    expect(res.error?.statusCode).toBe(400)
    expect(res.error?.message).toBe('Title is required')
    expect(typeof res.timestamp).toBe('string')
  })

  it('defaults data to empty object', () => {
    const res = createErrorResponse('Error', 500)
    expect(res.data).toEqual({})
  })

  it('passes custom data through', () => {
    const res = createErrorResponse('Error', 500, undefined, { field: 'name' })
    expect(res.data).toEqual({ field: 'name' })
  })
})
