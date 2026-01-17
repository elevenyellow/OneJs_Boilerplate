import { DomainError } from './base/domain-error.base'
import { HttpStatus } from './http-codes'

export class CragNotFoundError extends DomainError {
  constructor(id: number) {
    super('CRAG_NOT_FOUND', HttpStatus.NOT_FOUND, `Crag with id ${id} not found`)
  }
}

export class CragAlreadyExistsError extends DomainError {
  constructor(id: number) {
    super('CRAG_ALREADY_EXISTS', HttpStatus.CONFLICT, `Crag with id ${id} already exists`)
  }
}
