import { NodeId } from '../value-objects/node-id.vo'
import { NodeInfo } from '../value-objects/node-info.vo'
import { NodeType } from '../value-objects/node-type.vo'
import { RouteWithTopo } from '../value-objects/route-with-topo.vo'
import type { ScrapedNode, ScrapedNodeDto } from './scraped-node.interface'
import { ScrapedRoute } from './scraped-route.entity'
import { TopoImage } from './topo-image.entity'

/**
 * Entity representing a complete scraped sector with all its routes and topo images.
 *
 * A sector can contain:
 * - Topo images showing the cliff/wall panorama with route lines
 * - Routes with their detailed data linked to topo annotations
 * - Sub-sectors (child areas that contain more routes)
 *
 * This entity aggregates the data needed to display a complete sector view:
 * - Panoramic images of the sector with SVG overlays
 * - Individual route images with their SVG lines
 * - Complete route data (grade, description, history, etc.)
 *
 * Implements ScrapedNode interface for recursive hierarchy traversal.
 * Used for Sector and Cliff node types.
 */
export class ScrapedSector implements ScrapedNode {
  private constructor(
    private readonly id: NodeId,
    private readonly type: NodeType,
    private readonly name: string,
    private readonly url: string,
    private readonly info: NodeInfo | null,
    private readonly topoImages: TopoImage[],
    private readonly routes: ScrapedRoute[],
    private readonly routesWithTopos: RouteWithTopo[],
    private readonly children: ScrapedNode[],
    private readonly subSectorIds: NodeId[],
  ) {}

  /**
   * Creates a ScrapedSector with all its data.
   */
  static create(
    id: NodeId,
    type: NodeType,
    name: string,
    url: string,
    info: NodeInfo | null,
    topoImages: TopoImage[],
    routes: ScrapedRoute[],
    routesWithTopos: RouteWithTopo[],
    children: ScrapedNode[],
    subSectorIds: NodeId[],
  ): ScrapedSector {
    return new ScrapedSector(
      id,
      type,
      name,
      url,
      info,
      [...topoImages],
      [...routes],
      [...routesWithTopos],
      [...children],
      [...subSectorIds],
    )
  }

  /**
   * Creates a ScrapedSector from scraper data.
   * This is the factory method used by TheCragApiScraper during traversal.
   *
   * @param id - The node ID
   * @param type - The node type (Sector or Cliff)
   * @param info - The node info with URL stubs, header image, and geometry
   * @param routes - The routes associated with this sector
   * @param topos - The topo images for this sector
   * @param children - Child nodes in the hierarchy
   */
  static fromScrapedData(
    id: NodeId,
    type: NodeType,
    info: NodeInfo,
    routes: ScrapedRoute[],
    topos: TopoImage[],
    children: ScrapedNode[],
  ): ScrapedSector {
    return new ScrapedSector(
      id,
      type,
      'Unknown', // name - will be enriched later if needed
      `/sector/${id.toString()}`, // url
      info,
      [...topos],
      [...routes],
      [], // routesWithTopos - legacy, will be populated if needed
      [...children],
      children.map((child) => child.getId()),
    )
  }

  // === ScrapedNode Interface Implementation ===

  getId(): NodeId {
    return this.id
  }

  getType(): NodeType {
    return this.type
  }

  getNameString(): string {
    return this.name
  }

  getInfo(): NodeInfo | null {
    return this.info
  }

  getChildren(): ScrapedNode[] {
    return [...this.children]
  }

  getRoutes(): ScrapedRoute[] {
    return [...this.routes]
  }

  // === Basic Properties ===

  getName(): string {
    return this.name
  }

  getUrl(): string {
    return this.url
  }

  // === Topo Images ===

  /**
   * Returns all topo images in this sector.
   * This includes both sector panoramas and route detail images.
   */
  getTopoImages(): TopoImage[] {
    return [...this.topoImages]
  }

  /**
   * Returns topo images that contain area/sector annotations (panoramic views).
   */
  getSectorTopoImages(): TopoImage[] {
    return this.topoImages.filter((topo) => topo.hasAreas())
  }

  /**
   * Returns topo images that contain route annotations.
   */
  getRouteTopoImages(): TopoImage[] {
    return this.topoImages.filter((topo) => topo.hasRoutes())
  }

  // === Routes ===

  /**
   * Returns all routes with their topo annotation links.
   */
  getRoutesWithTopos(): RouteWithTopo[] {
    return [...this.routesWithTopos]
  }

  /**
   * Returns only routes that have topo annotations.
   */
  getRoutesWithAnnotations(): RouteWithTopo[] {
    return this.routesWithTopos.filter((r) => r.hasTopoAnnotation())
  }

  /**
   * Returns only routes that don't have topo annotations.
   */
  getRoutesWithoutAnnotations(): RouteWithTopo[] {
    return this.routesWithTopos.filter((r) => !r.hasTopoAnnotation())
  }

  /**
   * Finds a route by its ID.
   */
  findRouteById(routeId: NodeId): RouteWithTopo | null {
    return (
      this.routesWithTopos.find((r) => r.getRouteId().equals(routeId)) ?? null
    )
  }

  // === Sub-sectors ===

  /**
   * Returns IDs of sub-sectors (child areas that need separate scraping).
   */
  getSubSectorIds(): NodeId[] {
    return [...this.subSectorIds]
  }

  // === State Checks ===

  hasRoutes(): boolean {
    return this.routes.length > 0 || this.routesWithTopos.length > 0
  }

  hasTopos(): boolean {
    return this.topoImages.length > 0
  }

  hasChildren(): boolean {
    return this.children.length > 0
  }

  hasSubSectors(): boolean {
    return this.subSectorIds.length > 0
  }

  // === Counts ===

  getRouteCount(): number {
    return this.routesWithTopos.length
  }

  getTopoCount(): number {
    return this.topoImages.length
  }

  getSubSectorCount(): number {
    return this.subSectorIds.length
  }

  /**
   * Returns the number of routes that have topo annotations.
   */
  getRoutesWithAnnotationsCount(): number {
    return this.getRoutesWithAnnotations().length
  }

  /**
   * Returns the percentage of routes that have topo annotations.
   */
  getTopoAnnotationCoverage(): number {
    if (this.routesWithTopos.length === 0) return 0
    return (
      (this.getRoutesWithAnnotationsCount() / this.routesWithTopos.length) * 100
    )
  }

  // === Comparison ===

  equals(other: ScrapedSector): boolean {
    return this.id.equals(other.id)
  }

  toString(): string {
    return `ScrapedSector(${this.id.toString()}: ${this.name}, ${this.routesWithTopos.length} routes, ${this.topoImages.length} topos)`
  }

  toDto(): ScrapedNodeDto {
    return {
      id: this.id.toString(),
      type: this.type.toString(),
      name: this.name,
      info: this.info?.toDto() ?? null,
      children: this.children.map((child) => child.toDto()),
      routes: this.routes.map((route) => ({
        id: route.getId().toString(),
        name: route.getName(),
        grade: route.getGradeString(),
        url: route.getUrl(),
      })),
      topos: this.topoImages.map((topo) => ({
        topoId: topo.getTopoId(),
        thumbnailUrl: topo.getThumbnailUrl(),
        fullImageUrl: topo.getFullImageUrl(),
      })),
    }
  }

  /**
   * Returns extended DTO with all sector-specific properties.
   */
  toExtendedDto() {
    return {
      ...this.toDto(),
      url: this.url,
      topoImages: this.topoImages.map((t) => ({
        topoId: t.getTopoId(),
        thumbnailUrl: t.getThumbnailUrl(),
        fullImageUrl: t.getFullImageUrl(),
        routeCount: t.getRouteCount(),
        areaCount: t.getAreaCount(),
      })),
      routesWithTopos: this.routesWithTopos.map((r) => ({
        id: r.getRouteId().toString(),
        name: r.getRouteName(),
        grade: r.getRouteGrade(),
        url: r.getRouteUrl(),
        hasTopoAnnotation: r.hasTopoAnnotation(),
        svgPathData: r.getSvgPathData(),
      })),
      subSectorIds: this.subSectorIds.map((id) => id.toString()),
      stats: {
        routeCount: this.routes.length + this.routesWithTopos.length,
        topoCount: this.topoImages.length,
        routesWithAnnotations: this.getRoutesWithAnnotationsCount(),
        annotationCoverage: this.getTopoAnnotationCoverage(),
      },
    }
  }
}
