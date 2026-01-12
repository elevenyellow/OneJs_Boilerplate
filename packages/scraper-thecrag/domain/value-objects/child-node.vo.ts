import type { GeometryData } from '@climb-zone/shared'
import { NodeId } from './node-id.vo'
import { NodeType } from './node-type.vo'

/**
 * Value Object representing a child node from TheCrag API.
 * Encapsulates the data returned by the /children/area API endpoint.
 *
 * API array format:
 * [id, name, urlStub, urlAncestorStub, subAreaCount, subType, asciiName, approach, map, geo, location, geolocation, geometry, ...]
 */
export class ChildNode {
  private constructor(
    private readonly id: NodeId,
    private readonly name: string,
    private readonly type: NodeType,
    private readonly urlStub: string | null,
    private readonly urlAncestorStub: string | null,
    private readonly geometry: GeometryData | null,
  ) {}

  /**
   * Creates a ChildNode from an API array item.
   * @param item - Array from the /children/area API response
   */
  static fromApiArrayItem(item: unknown[]): ChildNode {
    const id = NodeId.create(Number(item[0]))
    const name = (item[1] as string) || ''
    const urlStub = (item[2] as string) || null
    const urlAncestorStub = (item[3] as string) || null
    const typeString = (item[5] as string) || 'Area'
    const type = NodeType.createFrom(typeString)
    const geometry = (item[12] as GeometryData) || null

    return new ChildNode(id, name, type, urlStub, urlAncestorStub, geometry)
  }

  /**
   * Creates a ChildNode with explicit values.
   */
  static create(
    id: NodeId,
    name: string,
    type: NodeType,
    urlStub: string | null,
    urlAncestorStub: string | null,
    geometry: GeometryData | null,
  ): ChildNode {
    return new ChildNode(id, name, type, urlStub, urlAncestorStub, geometry)
  }

  // === Getters ===

  /**
   * Returns the node ID.
   */
  getId(): NodeId {
    return this.id
  }

  /**
   * Returns the node name.
   */
  getName(): string {
    return this.name
  }

  /**
   * Returns the node type value object.
   */
  getType(): NodeType {
    return this.type
  }

  /**
   * Returns the URL stub for this node.
   */
  getUrlStub(): string | null {
    return this.urlStub
  }

  /**
   * Returns the ancestor URL stub.
   */
  getUrlAncestorStub(): string | null {
    return this.urlAncestorStub
  }

  /**
   * Returns the geometry data.
   */
  getGeometry(): GeometryData | null {
    return this.geometry
  }

  // === State Checks ===

  /**
   * Returns true if the node has geometry coordinates.
   */
  hasGeometry(): boolean {
    return this.geometry !== null
  }

  /**
   * Returns true if the node has a URL stub.
   */
  hasUrlStub(): boolean {
    return this.urlStub !== null && this.urlStub.length > 0
  }

  /**
   * Returns true if the node has an ancestor URL stub.
   */
  hasUrlAncestorStub(): boolean {
    return this.urlAncestorStub !== null && this.urlAncestorStub.length > 0
  }

  // === Comparison ===

  /**
   * Compares two ChildNodes by their ID.
   */
  equals(other: ChildNode): boolean {
    return this.id.equals(other.id)
  }

  toString(): string {
    return `ChildNode(${this.id.toString()}: ${this.name} [${this.type.toString()}])`
  }
}
