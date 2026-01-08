import { v4 as uuidv4 } from 'uuid'

/**
 * Base class for entity identifiers
 * Each entity should have its own ID type extending this
 */
export abstract class EntityId {
  protected constructor(protected readonly value: string) {}

  protected static isValidUuid(id: string): boolean {
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
    return uuidRegex.test(id)
  }

  protected static isValidCuid(id: string): boolean {
    // cuid format: starts with 'c', followed by alphanumeric
    return /^c[a-z0-9]{24,}$/i.test(id)
  }

  protected static generateUuid(): string {
    return uuidv4()
  }

  equals(other: EntityId): boolean {
    if (!(other instanceof this.constructor)) {
      return false
    }
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}

/**
 * Value Object for TheCrag external IDs (numeric, can be large)
 */
export class ExternalId {
  private constructor(private readonly value: bigint) {
    if (value <= 0n) {
      throw new Error(
        `ExternalId must be a positive integer, got: ${value}`,
      )
    }
  }

  static create(id: number | string | bigint): ExternalId {
    const bigId = typeof id === 'bigint' ? id : BigInt(id)
    return new ExternalId(bigId)
  }

  equals(other: ExternalId): boolean {
    return this.value === other.value
  }

  toBigInt(): bigint {
    return this.value
  }

  toNumber(): number {
    return Number(this.value)
  }

  toString(): string {
    return String(this.value)
  }
}
