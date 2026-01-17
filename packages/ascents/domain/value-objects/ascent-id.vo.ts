import { randomUUID } from 'crypto'

export class AscentId {
  private constructor(private readonly value: string) {}

  static generate(): AscentId {
    return new AscentId(randomUUID())
  }

  static createFrom(value: string): AscentId {
    if (!value || value.trim().length === 0) {
      throw new Error('AscentId cannot be empty')
    }
    return new AscentId(value)
  }

  getValue(): string {
    return this.value
  }

  toString(): string {
    return this.value
  }

  equals(other: AscentId): boolean {
    return this.value === other.value
  }
}
