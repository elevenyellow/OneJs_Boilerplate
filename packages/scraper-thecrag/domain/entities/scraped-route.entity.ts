import { NodeId } from '../value-objects/node-id.vo'
import { RawHtmlResponse } from '../value-objects/raw-html-response.vo'
import { RawNodeResponse } from '../value-objects/raw-node-response.vo'
import { RouteBeta } from '../value-objects/route-beta.vo'
import { RouteGrade } from '../value-objects/route-grade.vo'
import { RouteHistory } from '../value-objects/route-history.vo'
import { RouteInfo } from '../value-objects/route-info.vo'

/**
 * Entity representing a scraped climbing route from TheCrag.
 * Contains all route-specific data including grade, style, FA info, and beta.
 */
export class ScrapedRoute {
  private static readonly DEFAULT_COLOR = '#808080'

  private constructor(
    private readonly id: NodeId,
    private readonly name: string,
    private readonly slug: string,
    private readonly url: string,
    private readonly grade: RouteGrade | null,
    private readonly routeInfo: RouteInfo | null,
    private readonly history: RouteHistory | null,
    private readonly beta: RouteBeta | null,
    private readonly parentAreaId: NodeId | null,
    private readonly rawNodeResponse: RawNodeResponse | null,
    private readonly rawHtmlResponse: RawHtmlResponse | null,
  ) {}

  /**
   * Creates a ScrapedRoute entity with the provided data.
   */
  static create(
    id: NodeId,
    name: string,
    slug: string,
    url: string,
    grade: RouteGrade | null,
    routeInfo: RouteInfo | null,
    history: RouteHistory | null,
    beta: RouteBeta | null,
    parentAreaId: NodeId | null,
    rawNodeResponse: RawNodeResponse | null,
    rawHtmlResponse: RawHtmlResponse | null,
  ): ScrapedRoute {
    return new ScrapedRoute(
      id,
      name,
      slug,
      url,
      grade,
      routeInfo,
      history,
      beta,
      parentAreaId,
      rawNodeResponse,
      rawHtmlResponse,
    )
  }

  // === Basic Properties ===

  getId(): NodeId {
    return this.id
  }

  getName(): string {
    return this.name
  }

  getSlug(): string {
    return this.slug
  }

  getUrl(): string {
    return this.url
  }

  // === Value Objects ===

  getGrade(): RouteGrade | null {
    return this.grade
  }

  getRouteInfo(): RouteInfo | null {
    return this.routeInfo
  }

  getHistory(): RouteHistory | null {
    return this.history
  }

  getBeta(): RouteBeta | null {
    return this.beta
  }

  getParentAreaId(): NodeId | null {
    return this.parentAreaId
  }

  // === Raw Responses ===

  getRawNodeResponse(): RawNodeResponse | null {
    return this.rawNodeResponse
  }

  getRawHtmlResponse(): RawHtmlResponse | null {
    return this.rawHtmlResponse
  }

  // === Convenience Getters for Grade ===

  getGradeString(): string | null {
    return this.grade?.getGrade() ?? null
  }

  getGradeClass(): string | null {
    return this.grade?.getGradeClass() ?? null
  }

  getGradeColor(): string {
    return this.grade?.getColor() ?? ScrapedRoute.DEFAULT_COLOR
  }

  isEasyGrade(): boolean {
    return this.grade?.isEasy() ?? false
  }

  isHardGrade(): boolean {
    return this.grade?.isHard() ?? false
  }

  // === Convenience Getters for Route Info ===

  getBolts(): number | null {
    return this.routeInfo?.getBolts() ?? null
  }

  getHeight(): string | null {
    return this.routeInfo?.getDisplayHeight() ?? null
  }

  getHeightInMeters(): number | null {
    return this.routeInfo?.getHeightInMeters() ?? null
  }

  getStars(): number | null {
    return this.routeInfo?.getStars() ?? null
  }

  getStarsString(): string {
    return this.routeInfo?.getStarsString() ?? ''
  }

  getStyle(): string | null {
    return this.routeInfo?.getStyleStub() ?? null
  }

  isSport(): boolean {
    return this.routeInfo?.isSport() ?? false
  }

  isTrad(): boolean {
    return this.routeInfo?.isTrad() ?? false
  }

  isBoulder(): boolean {
    return this.routeInfo?.isBoulder() ?? false
  }

  // === Convenience Getters for History ===

  getFirstAscentClimber(): string | null {
    return this.history?.getClimber() ?? null
  }

  getFirstAscentYear(): number | null {
    return this.history?.getYear() ?? null
  }

  getFirstAscentDate(): string | null {
    return this.history?.getDate() ?? null
  }

  isFirstAscent(): boolean {
    return this.history?.isFirstAscent() ?? false
  }

  isFirstFreeAscent(): boolean {
    return this.history?.isFirstFreeAscent() ?? false
  }

  // === Convenience Getters for Beta ===

  hasBeta(): boolean {
    return this.beta?.hasBeta() ?? false
  }

  getDescription(): string | null {
    return this.beta?.getDescription() ?? null
  }

  getApproach(): string | null {
    return this.beta?.getApproach() ?? null
  }

  // === State Checks ===

  hasGrade(): boolean {
    return this.grade !== null
  }

  hasRouteInfo(): boolean {
    return this.routeInfo !== null
  }

  hasHistory(): boolean {
    return this.history !== null
  }

  hasParentArea(): boolean {
    return this.parentAreaId !== null
  }

  // === Comparison ===

  equals(other: ScrapedRoute): boolean {
    return this.id.toString() === other.id.toString()
  }

  toString(): string {
    const grade = this.grade?.getGrade() ?? 'no grade'
    return `ScrapedRoute(${this.id.toString()}: ${this.name} - ${grade})`
  }
}
