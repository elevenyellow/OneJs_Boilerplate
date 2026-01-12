import { ErrorCodes, OneJsError } from '@OneJs/core'

/**
 * Value Object representing a TheCrag node identifier.
 * Node IDs are numeric identifiers used by TheCrag to identify areas, crags, sectors, and routes.
 */
export class NodeId {
  private static readonly MIN_VALUE = 1

  private constructor(private readonly value: number) {}

  /**
   * Creates a NodeId from user input with full validation.
   * Use this for external/untrusted input.
   */
  static create(value: number | string): NodeId {
    const numericValue =
      typeof value === 'string' ? Number.parseInt(value, 10) : value

    if (Number.isNaN(numericValue)) {
      throw new OneJsError(
        'Invalid node ID format',
        400,
        'Node ID must be a valid number',
        { value: String(value) },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    if (!Number.isInteger(numericValue)) {
      throw new OneJsError(
        'Invalid node ID',
        400,
        'Node ID must be an integer',
        { value: numericValue },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    if (numericValue < this.MIN_VALUE) {
      throw new OneJsError(
        'Invalid node ID',
        400,
        `Node ID must be greater than or equal to ${this.MIN_VALUE}`,
        { value: numericValue },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    return new NodeId(numericValue)
  }

  /**
   * Creates a NodeId from trusted source (e.g., database).
   * Performs minimal validation for performance.
   */
  static createFrom(value: number | string): NodeId {
    const numericValue =
      typeof value === 'string' ? Number.parseInt(value, 10) : value

    if (Number.isNaN(numericValue) || numericValue < this.MIN_VALUE) {
      throw new OneJsError(
        'Invalid node ID from trusted source',
        500,
        'Database contains invalid node ID',
        { value: String(value) },
        ErrorCodes.SERVER_ERROR,
      )
    }

    return new NodeId(numericValue)
  }

  getValue(): number {
    return this.value
  }

  toString(): string {
    return String(this.value)
  }

  equals(other: NodeId): boolean {
    return this.value === other.value
  }
}
