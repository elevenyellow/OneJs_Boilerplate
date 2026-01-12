import { ErrorCodes, OneJsError } from '@OneJs/core'

/**
 * Enum of valid node types in TheCrag hierarchy.
 */
const NODE_TYPE_VALUES = ['Region', 'Area', 'Crag', 'Sector', 'Cliff'] as const

type NodeTypeValue = (typeof NODE_TYPE_VALUES)[number]

/**
 * Node types that can have child areas (expandable in traversal).
 * Cliff is a leaf node that only contains routes.
 */
const EXPANDABLE_NODE_TYPES: NodeTypeValue[] = [
  'Region',
  'Area',
  'Crag',
  'Sector',
]

/**
 * Value Object representing the type of a node in TheCrag hierarchy.
 * Valid types are: Region, Area, Crag, Sector, Cliff
 *
 * The hierarchy typically follows: Region > Area > Crag > Sector > Cliff > Routes
 */
export class NodeType {
  private constructor(private readonly value: NodeTypeValue) {}

  /**
   * Creates a NodeType from user input with full validation.
   * Use this for external/untrusted input.
   */
  static create(value: string): NodeType {
    if (!this.isValidNodeType(value)) {
      throw new OneJsError(
        'Invalid node type',
        400,
        `Node type must be one of: ${NODE_TYPE_VALUES.join(', ')}`,
        { value },
        ErrorCodes.VALIDATION_FAILED,
      )
    }

    return new NodeType(value as NodeTypeValue)
  }

  /**
   * Creates a NodeType from trusted source (e.g., database, API response).
   * Performs minimal validation for performance.
   */
  static createFrom(value: string): NodeType {
    if (!this.isValidNodeType(value)) {
      throw new OneJsError(
        'Invalid node type from trusted source',
        500,
        'Data source contains invalid node type',
        { value },
        ErrorCodes.SERVER_ERROR,
      )
    }

    return new NodeType(value as NodeTypeValue)
  }

  // === Static Factory Methods ===

  /**
   * Creates a Region node type.
   */
  static region(): NodeType {
    return new NodeType('Region')
  }

  /**
   * Creates an Area node type.
   */
  static area(): NodeType {
    return new NodeType('Area')
  }

  /**
   * Creates a Crag node type.
   */
  static crag(): NodeType {
    return new NodeType('Crag')
  }

  /**
   * Creates a Sector node type.
   */
  static sector(): NodeType {
    return new NodeType('Sector')
  }

  /**
   * Creates a Cliff node type.
   */
  static cliff(): NodeType {
    return new NodeType('Cliff')
  }

  // === Type Check Methods ===

  /**
   * Returns true if this is a Region type.
   */
  isRegion(): boolean {
    return this.value === 'Region'
  }

  /**
   * Returns true if this is an Area type.
   */
  isArea(): boolean {
    return this.value === 'Area'
  }

  /**
   * Returns true if this is a Crag type.
   */
  isCrag(): boolean {
    return this.value === 'Crag'
  }

  /**
   * Returns true if this is a Sector type.
   */
  isSector(): boolean {
    return this.value === 'Sector'
  }

  /**
   * Returns true if this is a Cliff type.
   */
  isCliff(): boolean {
    return this.value === 'Cliff'
  }

  /**
   * Returns true if this node type can have children areas.
   * Cliff is a leaf node that only contains routes, so it's not expandable.
   */
  isExpandable(): boolean {
    return EXPANDABLE_NODE_TYPES.includes(this.value)
  }

  // === Accessors ===

  /**
   * Returns the raw string value of the node type.
   */
  getValue(): NodeTypeValue {
    return this.value
  }

  /**
   * Returns the string representation.
   */
  toString(): string {
    return this.value
  }

  // === Comparison ===

  /**
   * Compares two NodeType instances for equality.
   */
  equals(other: NodeType): boolean {
    return this.value === other.value
  }

  // === Private Helpers ===

  private static isValidNodeType(value: string): value is NodeTypeValue {
    return NODE_TYPE_VALUES.includes(value as NodeTypeValue)
  }
}
