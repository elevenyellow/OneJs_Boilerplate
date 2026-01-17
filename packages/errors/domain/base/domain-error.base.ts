import { OneJsError } from '@OneJs/core'

export abstract class DomainError extends OneJsError {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string,
  ) {
    super(code, statusCode, message)
    this.name = this.constructor.name
  }
}
