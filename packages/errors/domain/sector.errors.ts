import { DomainError } from './base/domain-error.base'
import { HttpStatus } from './http-codes'

export class SectorNotFoundError extends DomainError {
  constructor(id: number) {
    super('SECTOR_NOT_FOUND', HttpStatus.NOT_FOUND, `Sector with id ${id} not found`)
  }
}

export class SectorAlreadyExistsError extends DomainError {
  constructor(id: number) {
    super('SECTOR_ALREADY_EXISTS', HttpStatus.CONFLICT, `Sector with id ${id} already exists`)
  }
}
