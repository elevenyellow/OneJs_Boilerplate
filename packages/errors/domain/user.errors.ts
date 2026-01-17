import { DomainError } from './base/domain-error.base'
import { HttpStatus } from './http-codes'

export class UserNotFoundError extends DomainError {
  constructor(identifier?: string) {
    const message = identifier ? `User ${identifier} not found` : 'User not found'
    super('USER_NOT_FOUND', HttpStatus.NOT_FOUND, message)
  }
}

export class UserAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super('USER_ALREADY_EXISTS', HttpStatus.CONFLICT, `User with email ${email} already exists`)
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('INVALID_CREDENTIALS', HttpStatus.UNAUTHORIZED, 'Invalid credentials')
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'Unauthorized access') {
    super('UNAUTHORIZED', HttpStatus.UNAUTHORIZED, message)
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'Access forbidden') {
    super('FORBIDDEN', HttpStatus.FORBIDDEN, message)
  }
}
