import { DomainError } from './base/domain-error.base'
import { HttpStatus } from './http-codes'

export class RouteNotFoundError extends DomainError {
  constructor(id: number) {
    super('ROUTE_NOT_FOUND', HttpStatus.NOT_FOUND, `Route with id ${id} not found`)
  }
}

export class RouteAlreadyExistsError extends DomainError {
  constructor(id: number) {
    super('ROUTE_ALREADY_EXISTS', HttpStatus.CONFLICT, `Route with id ${id} already exists`)
  }
}
