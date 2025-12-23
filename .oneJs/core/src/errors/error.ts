import type { ErrorCode } from './error-codes'

export class OneJsError extends Error {
  statusCode: number
  explanatoryMessage: string
  code?: ErrorCode
  data?: any

  constructor(
    message: string,
    statusCode: number,
    explanatoryMessage: string,
    data?: any,
    code?: ErrorCode,
  ) {
    super(message)
    this.statusCode = statusCode
    this.explanatoryMessage = explanatoryMessage
    this.data = data
    this.code = code

    Object.setPrototypeOf(this, OneJsError.prototype)
  }

  toResponse(): Response {
    return new Response(
      JSON.stringify({
        success: false,
        message: this.message,
        data: this.data ?? {},
        timestamp: new Date().toISOString(),
        error: {
          statusCode: this.statusCode,
          message: this.explanatoryMessage,
          code: this.code,
        },
      }),
      {
        status: this.statusCode,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
