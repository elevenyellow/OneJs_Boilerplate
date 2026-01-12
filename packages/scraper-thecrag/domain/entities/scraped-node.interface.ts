import type { NodeId } from '../value-objects/node-id.vo'
import type { NodeInfo } from '../value-objects/node-info.vo'
import type { NodeType } from '../value-objects/node-type.vo'
import type { ScrapedRoute } from './scraped-route.entity'
import type { TopoImage } from './topo-image.entity'

/**
 * Common interface for all scraped node entities in the hierarchy.
 * Implemented by both ScrapedArea (for Region, Area, Crag) and
 * ScrapedSector (for Sector, Cliff).
 *
 * This enables recursive traversal of the scraped data tree where
 * each node can contain children of the same type.
 */
export interface ScrapedNode {
  /**
   * Returns the unique identifier for this node.
   */
  getId(): NodeId

  /**
   * Returns the type of this node (Region, Area, Crag, Sector, Cliff).
   */
  getType(): NodeType

  /**
   * Returns the name of this node.
   */
  getNameString(): string

  /**
   * Returns the node metadata (URL stubs, header image, geometry).
   */
  getInfo(): NodeInfo | null

  /**
   * Returns child nodes in the hierarchy.
   */
  getChildren(): ScrapedNode[]

  /**
   * Returns true if this node has children.
   */
  hasChildren(): boolean

  /**
   * Returns routes associated with this node.
   */
  getRoutes(): ScrapedRoute[]

  /**
   * Returns true if this node has routes.
   */
  hasRoutes(): boolean

  /**
   * Returns topo images for this node.
   */
  getTopoImages(): TopoImage[]

  /**
   * Returns true if this node has topo images.
   */
  hasTopos(): boolean

  /**
   * Converts the node to a DTO for serialization.
   */
  toDto(): ScrapedNodeDto
}

/**
 * DTO structure for serialized scraped nodes.
 */
export interface ScrapedNodeDto {
  id: string
  type: string
  name: string
  info: unknown | null
  children: ScrapedNodeDto[]
  routes: unknown[]
  topos: unknown[]
  cragTopos?: unknown[]
}
