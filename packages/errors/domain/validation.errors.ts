import { DomainError } from './base/domain-error.base'
import { HttpStatus } from './http-codes'

export class ValidationError extends DomainError {
  constructor(message: string, public readonly field?: string) {
    super('VALIDATION_ERROR', HttpStatus.BAD_REQUEST, message)
  }
}

export class RequiredFieldError extends ValidationError {
  constructor(field: string) {
    super(`${field} is required`, field)
  }
}

export class InvalidFormatError extends ValidationError {
  constructor(field: string, expectedFormat?: string) {
    const message = expectedFormat
      ? `Invalid ${field} format. Expected: ${expectedFormat}`
      : `Invalid ${field} format`
    super(message, field)
  }
}

export class MinLengthError extends ValidationError {
  constructor(field: string, minLength: number) {
    super(`${field} must be at least ${minLength} characters`, field)
  }
}

export class MaxLengthError extends ValidationError {
  constructor(field: string, maxLength: number) {
    super(`${field} must be at most ${maxLength} characters`, field)
  }
}

export class InvalidValueError extends ValidationError {
  constructor(field: string, allowedValues?: string[]) {
    const message = allowedValues
      ? `Invalid value for ${field}. Allowed values: ${allowedValues.join(', ')}`
      : `Invalid value for ${field}`
    super(message, field)
  }
}
