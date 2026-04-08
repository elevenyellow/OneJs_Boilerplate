import type { ErrorCode } from './error-codes'

export class OneJsError extends Error {
  statusCode: number
  explanatoryMessage: string
  code?: ErrorCode
  data?: unknown

  constructor(
    message: string,
    statusCode: number,
    explanatoryMessage: string,
    data?: unknown,
    code?: ErrorCode,
  ) {
    super(message)
    this.statusCode = statusCode
    this.explanatoryMessage = explanatoryMessage
    this.data = data
    this.code = code

    Object.setPrototypeOf(this, OneJsError.prototype)
  }
}
