export abstract class ValueObject<T> {
  constructor(protected readonly _value: T) {}

  getValue(): T {
    return this._value
  }

  equals(other: ValueObject<T>): boolean {
    return JSON.stringify(this._value) === JSON.stringify(other._value)
  }

  toString(): string {
    return String(this._value)
  }

  toJSON(): T {
    return this._value
  }
}
