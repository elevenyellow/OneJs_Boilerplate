import { AreaBeta } from '../value-objects/area-beta.vo'
import { AreaName } from '../value-objects/area-name.vo'
import { AreaSlug } from '../value-objects/area-slug.vo'
import { AreaUrl } from '../value-objects/area-url.vo'
import { ImageUrl } from '../value-objects/image-url.vo'
import { NodeId } from '../value-objects/node-id.vo'
import { NodeMetadata } from '../value-objects/node-metadata.vo'
import { NodeSeasonality } from '../value-objects/node-seasonality.vo'
import { NodeStatistics } from '../value-objects/node-statistics.vo'
import { NodeTags } from '../value-objects/node-tags.vo'
import { RawHtmlResponse } from '../value-objects/raw-html-response.vo'
import { RawNodeResponse } from '../value-objects/raw-node-response.vo'
import { TopoImage } from '../value-objects/topo-image.vo'
import { WebCoverImage } from '../value-objects/webcover-image.vo'

/**
 * Entity representing a scraped area/crag/sector from TheCrag.
 * This is the aggregate root for scraped area data, containing all
 * associated value objects and providing convenience access methods.
 */
export class ScrapedArea {
  private constructor(
    private readonly id: NodeId,
    private readonly name: AreaName,
    private readonly slug: AreaSlug,
    private readonly url: AreaUrl,
    private readonly beta: AreaBeta,
    private readonly statistics: NodeStatistics | null,
    private readonly seasonality: NodeSeasonality | null,
    private readonly tags: NodeTags | null,
    private readonly metadata: NodeMetadata | null,
    private readonly webCoverImage: WebCoverImage | null,
    private readonly ogImage: ImageUrl | null,
    private readonly topoImages: TopoImage[],
    private readonly childIds: NodeId[],
    private readonly rawNodeResponse: RawNodeResponse | null,
    private readonly rawHtmlResponse: RawHtmlResponse | null,
  ) {}

  /**
   * Creates a ScrapedArea entity with the provided data.
   */
  static create(
    id: NodeId,
    name: AreaName,
    slug: AreaSlug,
    url: AreaUrl,
    beta: AreaBeta,
    statistics: NodeStatistics | null,
    seasonality: NodeSeasonality | null,
    tags: NodeTags | null,
    metadata: NodeMetadata | null,
    webCoverImage: WebCoverImage | null,
    ogImage: ImageUrl | null,
    topoImages: TopoImage[],
    childIds: NodeId[],
    rawNodeResponse: RawNodeResponse | null,
    rawHtmlResponse: RawHtmlResponse | null,
  ): ScrapedArea {
    return new ScrapedArea(
      id,
      name,
      slug,
      url,
      beta,
      statistics,
      seasonality,
      tags,
      metadata,
      webCoverImage,
      ogImage,
      topoImages,
      childIds,
      rawNodeResponse,
      rawHtmlResponse,
    )
  }

  // === Basic Properties ===

  getId(): NodeId {
    return this.id
  }

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
    return this.childIds.length > 0
  }

  getChildCount(): number {
    return this.childIds.length
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

  toDto() {
    return {
      id: this.id.toString(),
      name: this.name.toString(),
      slug: this.slug.toString(),
      url: this.url.toString(),
      beta: this.beta.toDto(),
      statistics: this.statistics,
      seasonality: this.seasonality,
      tags: this.tags,
      metadata: this.metadata,
      webCoverImage: this.webCoverImage,
      ogImage: this.ogImage,
      topoImages: this.topoImages,

      childIds: this.childIds,

      rawNodeResponse: this.rawNodeResponse,
      rawHtmlResponse: this.rawHtmlResponse,
    }
  }
}
