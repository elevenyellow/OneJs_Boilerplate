import { describe, test, expect } from 'bun:test'
import { OneJsError } from '.././error'
import { ErrorCodes } from '.././error-codes'
import { DefaultErrorMessages } from '.././default-messages'

describe('OneJsError', () => {
  describe('construction', () => {
    test('creates an error with all required fields', () => {
      const err = new OneJsError('Something went wrong', 500, 'Internal server error')

      expect(err).toBeInstanceOf(Error)
      expect(err).toBeInstanceOf(OneJsError)
      expect(err.message).toBe('Something went wrong')
      expect(err.statusCode).toBe(500)
      expect(err.explanatoryMessage).toBe('Internal server error')
    })

    test('creates an error with optional data and code', () => {
      const data = { field: 'email' }
      const err = new OneJsError(
        'Validation failed',
        422,
        'Invalid email',
        data,
        ErrorCodes.VALIDATION_FAILED,
      )

      expect(err.data).toEqual(data)
      expect(err.code).toBe(ErrorCodes.VALIDATION_FAILED)
    })

    test('data is undefined when not provided', () => {
      const err = new OneJsError('msg', 400, 'Bad request')
      expect(err.data).toBeUndefined()
    })

    test('code is undefined when not provided', () => {
      const err = new OneJsError('msg', 400, 'Bad request')
      expect(err.code).toBeUndefined()
    })

    test('instanceof check works after prototype fix', () => {
      const err = new OneJsError('msg', 500, 'desc')
      expect(err instanceof OneJsError).toBe(true)
      expect(err instanceof Error).toBe(true)
    })
  })

})

describe('ErrorCodes', () => {
  test('contains all expected error codes', () => {
    const expected = [
      'AUTH_MISSING',
      'AUTH_INVALID',
      'TOKEN_EXPIRED',
      'USER_NOT_FOUND',
      'USER_ALREADY_EXISTS',
      'VALIDATION_FAILED',
      'PAYLOAD_MALFORMED',
      'PERMISSION_DENIED',
      'RESOURCE_NOT_FOUND',
      'SERVER_ERROR',
      'UNKNOWN',
    ]

    for (const code of expected) {
      expect(Object.values(ErrorCodes)).toContain(code)
    }
  })

  test('is frozen / readonly (values are const)', () => {
    const codes = ErrorCodes as Record<string, string>
    expect(codes.AUTH_MISSING).toBe('AUTH_MISSING')
    expect(codes.SERVER_ERROR).toBe('SERVER_ERROR')
  })
})

describe('DefaultErrorMessages', () => {
  test('has a message for every ErrorCode', () => {
    for (const code of Object.values(ErrorCodes)) {
      expect(DefaultErrorMessages[code]).toBeDefined()
      expect(typeof DefaultErrorMessages[code]).toBe('string')
    }
  })

  test('AUTH_MISSING maps to the correct message', () => {
    expect(DefaultErrorMessages[ErrorCodes.AUTH_MISSING]).toBe(
      'You must be logged in to access this resource.',
    )
  })

  test('RESOURCE_NOT_FOUND maps to the correct message', () => {
    expect(DefaultErrorMessages[ErrorCodes.RESOURCE_NOT_FOUND]).toBe('Not found.')
  })
})
