import { AreaBeta } from '../value-objects/area-beta.vo'
import { AreaName } from '../value-objects/area-name.vo'
import { AreaSlug } from '../value-objects/area-slug.vo'
import { AreaUrl } from '../value-objects/area-url.vo'
import { ImageUrl } from '../value-objects/image-url.vo'
import { NodeId } from '../value-objects/node-id.vo'
import { NodeInfo } from '../value-objects/node-info.vo'
import { NodeMetadata } from '../value-objects/node-metadata.vo'
import { NodeSeasonality } from '../value-objects/node-seasonality.vo'
import { NodeStatistics } from '../value-objects/node-statistics.vo'
import { NodeTags } from '../value-objects/node-tags.vo'
import { NodeType } from '../value-objects/node-type.vo'
import { RawHtmlResponse } from '../value-objects/raw-html-response.vo'
import { RawNodeResponse } from '../value-objects/raw-node-response.vo'
import { WebCoverImage } from '../value-objects/webcover-image.vo'
import type { ScrapedNode, ScrapedNodeDto } from './scraped-node.interface'
import { ScrapedRoute } from './scraped-route.entity'
import { TopoImage } from './topo-image.entity'

/**
 * Entity representing a scraped area/crag/sector from TheCrag.
 * This is the aggregate root for scraped area data, containing all
 * associated value objects and providing convenience access methods.
 *
 * Implements ScrapedNode interface for recursive hierarchy traversal.
 * Used for Region, Area, and Crag node types.
 */
export class ScrapedArea implements ScrapedNode {
  private constructor(
    private readonly id: NodeId,
    private readonly type: NodeType,
    private readonly name: AreaName,
    private readonly slug: AreaSlug,
    private readonly url: AreaUrl,
    private readonly info: NodeInfo | null,
    private readonly beta: AreaBeta,
    private readonly statistics: NodeStatistics | null,
    private readonly seasonality: NodeSeasonality | null,
    private readonly tags: NodeTags | null,
    private readonly metadata: NodeMetadata | null,
    private readonly webCoverImage: WebCoverImage | null,
    private readonly ogImage: ImageUrl | null,
    private readonly topoImages: TopoImage[],
    private readonly cragTopos: TopoImage[],
    private readonly routes: ScrapedRoute[],
    private readonly children: ScrapedNode[],
    private readonly childIds: NodeId[],
    private readonly rawNodeResponse: RawNodeResponse | null,
    private readonly rawHtmlResponse: RawHtmlResponse | null,
  ) {}

  /**
   * Creates a ScrapedArea entity with the provided data.
   */
  static create(
    id: NodeId,
    type: NodeType,
    name: AreaName,
    slug: AreaSlug,
    url: AreaUrl,
    info: NodeInfo | null,
    beta: AreaBeta,
    statistics: NodeStatistics | null,
    seasonality: NodeSeasonality | null,
    tags: NodeTags | null,
    metadata: NodeMetadata | null,
    webCoverImage: WebCoverImage | null,
    ogImage: ImageUrl | null,
    topoImages: TopoImage[],
    cragTopos: TopoImage[],
    routes: ScrapedRoute[],
    children: ScrapedNode[],
    childIds: NodeId[],
    rawNodeResponse: RawNodeResponse | null,
    rawHtmlResponse: RawHtmlResponse | null,
  ): ScrapedArea {
    return new ScrapedArea(
      id,
      type,
      name,
      slug,
      url,
      info,
      beta,
      statistics,
      seasonality,
      tags,
      metadata,
      webCoverImage,
      ogImage,
      [...topoImages],
      [...cragTopos],
      [...routes],
      [...children],
      [...childIds],
      rawNodeResponse,
      rawHtmlResponse,
    )
  }

  /**
   * Creates a ScrapedArea from scraper data.
   * This is the factory method used by TheCragApiScraper during traversal.
   *
   * @param id - The node ID
   * @param type - The node type (Region, Area, or Crag)
   * @param info - The node info with URL stubs, header image, and geometry
   * @param routes - The routes associated with this area
   * @param topos - The topo images for this area
   * @param cragTopos - The crag overview topos (only for Crag type)
   * @param children - Child nodes in the hierarchy
   */
  static fromScrapedData(
    id: NodeId,
    type: NodeType,
    info: NodeInfo,
    routes: ScrapedRoute[],
    topos: TopoImage[],
    cragTopos: TopoImage[],
    children: ScrapedNode[],
  ): ScrapedArea {
    // Create minimal value objects for required fields
    const name = AreaName.createFrom('Unknown')
    const slug = AreaSlug.createFrom('unknown')
    const url = AreaUrl.createFrom(`/area/${id.toString()}`)
    const beta = AreaBeta.empty()

    return new ScrapedArea(
      id,
      type,
      name,
      slug,
      url,
      info,
      beta,
      null, // statistics
      null, // seasonality
      null, // tags
      null, // metadata
      null, // webCoverImage
      null, // ogImage
      [...topos],
      [...cragTopos],
      [...routes],
      [...children],
      children.map((child) => child.getId()),
      null, // rawNodeResponse
      null, // rawHtmlResponse
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
    return this.name.toString()
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

  getName(): AreaName {
    return this.name
  }

  getSlug(): AreaSlug {
    return this.slug
  }

  getUrl(): AreaUrl {
    return this.url
  }

  // === Beta (Summary, Description, Approach) ===

  getBeta(): AreaBeta {
    return this.beta
  }

  getSummary(): string | null {
    return this.beta.getSummary()
  }

  getDescription(): string | null {
    return this.beta.getDescription()
  }

  getApproach(): string | null {
    return this.beta.getApproach()
  }

  hasBeta(): boolean {
    return this.beta.hasBeta()
  }

  // === Value Objects ===

  getStatistics(): NodeStatistics | null {
    return this.statistics
  }

  getSeasonality(): NodeSeasonality | null {
    return this.seasonality
  }

  getTags(): NodeTags | null {
    return this.tags
  }

  getMetadata(): NodeMetadata | null {
    return this.metadata
  }

  getWebCoverImage(): WebCoverImage | null {
    return this.webCoverImage
  }

  getOgImage(): ImageUrl | null {
    return this.ogImage
  }

  getTopoImages(): TopoImage[] {
    return [...this.topoImages]
  }

  getCragTopos(): TopoImage[] {
    return [...this.cragTopos]
  }

  getChildIds(): NodeId[] {
    return [...this.childIds]
  }

  // === Raw Responses ===

  getRawNodeResponse(): RawNodeResponse | null {
    return this.rawNodeResponse
  }

  getRawHtmlResponse(): RawHtmlResponse | null {
    return this.rawHtmlResponse
  }

  // === Convenience Getters for Statistics ===

  getRoutesCount(): number | null {
    return this.statistics?.getRoutes() ?? null
  }

  getAscentsCount(): number | null {
    return this.statistics?.getAscents() ?? null
  }

  getPhotosCount(): number | null {
    return this.statistics?.getPhotos() ?? null
  }

  getFavoritesCount(): number | null {
    return this.statistics?.getFavorites() ?? null
  }

  getKudosCount(): number | null {
    return this.statistics?.getKudos() ?? null
  }

  // === Convenience Getters for Seasonality ===

  getBestMonth(): string | null {
    return this.seasonality?.getBestMonth() ?? null
  }

  getBestMonths(): string[] {
    return this.seasonality?.getBestMonths() ?? []
  }

  // === Convenience Getters for Tags ===

  isKidFriendly(): boolean {
    return this.tags?.isKidFriendly() ?? false
  }

  isDogFriendly(): boolean {
    return this.tags?.isDogFriendly() ?? false
  }

  isBeginnerFriendly(): boolean {
    return this.tags?.isBeginnerFriendly() ?? false
  }

  getAspect(): string | null {
    return this.tags?.getAspect() ?? null
  }

  getWalkInTime(): string | null {
    return this.tags?.getWalkInTime() ?? null
  }

  // === Convenience Getters for Metadata ===

  isTLC(): boolean {
    return this.metadata?.isTLC() ?? false
  }

  isPremium(): boolean {
    return this.metadata?.isPremium() ?? false
  }

  getDepth(): number | null {
    return this.metadata?.getDepth() ?? null
  }

  // === Topo Methods ===

  hasTopos(): boolean {
    return this.topoImages.length > 0
  }

  getTopoCount(): number {
    return this.topoImages.length
  }

  getTotalRoutesInTopos(): number {
    return this.topoImages.reduce((sum, topo) => sum + topo.getRouteCount(), 0)
  }

  // === Child Methods ===

  hasChildren(): boolean {
    return this.children.length > 0
  }

  getChildCount(): number {
    return this.children.length
  }

  // === Route Methods ===

  hasRoutes(): boolean {
    return this.routes.length > 0
  }

  getRouteCount(): number {
    return this.routes.length
  }

  // === Image Methods ===

  hasWebCover(): boolean {
    return this.webCoverImage !== null
  }

  hasOgImage(): boolean {
    return this.ogImage !== null
  }

  getPrimaryImageUrl(): string | null {
    if (this.webCoverImage) {
      return this.webCoverImage.getFullUrl()
    }
    if (this.ogImage) {
      return this.ogImage.getFullUrl()
    }
    return null
  }

  // === Comparison ===

  equals(other: ScrapedArea): boolean {
    return this.id.toString() === other.id.toString()
  }

  toString(): string {
    return `ScrapedArea(${this.id.toString()}: ${this.name})`
  }

  toDto(): ScrapedNodeDto {
    return {
      id: this.id.toString(),
      type: this.type.toString(),
      name: this.name.toString(),
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
      cragTopos: this.cragTopos.map((topo) => ({
        topoId: topo.getTopoId(),
        thumbnailUrl: topo.getThumbnailUrl(),
        fullImageUrl: topo.getFullImageUrl(),
      })),
    }
  }

  /**
   * Returns extended DTO with all area-specific properties.
   */
  toExtendedDto() {
    return {
      ...this.toDto(),
      slug: this.slug.toString(),
      url: this.url.toString(),
      beta: this.beta.toDto(),
      statistics: this.statistics,
      seasonality: this.seasonality,
      tags: this.tags,
      metadata: this.metadata,
      webCoverImage: this.webCoverImage,
      ogImage: this.ogImage,
      childIds: this.childIds.map((id) => id.toString()),
      rawNodeResponse: this.rawNodeResponse,
      rawHtmlResponse: this.rawHtmlResponse,
    }
  }
}
