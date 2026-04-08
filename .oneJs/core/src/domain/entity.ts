import type { ValueObject } from './value-object'

export abstract class Entity<TId extends ValueObject<unknown>> {
  private readonly _id: TId

  constructor(id: TId) {
    this._id = id
  }

  getId(): TId {
    return this._id
  }

  equals(other: Entity<TId>): boolean {
    return this._id.equals(other._id)
  }

  abstract toDto(): object
}
