import { NodeId } from '../value-objects/node-id.vo'
import { RawHtmlResponse } from '../value-objects/raw-html-response.vo'
import { RawNodeResponse } from '../value-objects/raw-node-response.vo'
import { RouteBeta } from '../value-objects/route-beta.vo'
import { RouteGrade } from '../value-objects/route-grade.vo'
import { RouteHistory } from '../value-objects/route-history.vo'
import { RouteInfo } from '../value-objects/route-info.vo'
import type { TopoAnnotation } from '../value-objects/topo-annotation.vo'

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

  /**
   * Input data structure from TheCrag API route children endpoint.
   * Fields correspond to the flatten parameter:
   * [id, name, grade, gradeIndex, height, pitches, quality, stars, ascents, subType, bolts, firstAscent, tags, warnings]
   */
  static fromApiRouteData(
    data: {
      id: number
      name: string
      grade: string | null
      gradeIndex: number | null
      height: number | null
      pitches: number | null
      quality: number | null
      stars: number | null
      ascents: number | null
      subType: string | null
      bolts: number | null
      firstAscent: string | null
      tags: string[] | null
      warnings: string[] | null
    },
    parentAreaId?: NodeId | null,
  ): ScrapedRoute {
    const routeId = NodeId.create(data.id)

    // Generate slug from name (normalize accented characters first)
    const slug = data.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Generate URL from ID
    const url = `/route/${data.id}`

    // Create RouteGrade if grade is available
    const grade = data.grade
      ? RouteGrade.create(
          data.grade,
          this.gradeIndexToGradeClass(data.gradeIndex),
        )
      : null

    // Create RouteInfo with all available data
    const routeInfo = RouteInfo.create({
      bolts: data.bolts,
      displayHeight: data.height ? `${data.height}m` : null,
      stars: data.stars,
      styleStub: data.subType,
      pitches: data.pitches,
      ascentCount: data.ascents,
    })

    // Parse first ascent string into RouteHistory
    const history = this.parseFirstAscentString(data.firstAscent)

    return new ScrapedRoute(
      routeId,
      data.name,
      slug,
      url,
      grade,
      routeInfo,
      history,
      null, // No beta from API route list
      parentAreaId ?? null,
      null, // No raw API response for list items
      null, // No raw HTML response
    )
  }

  /**
   * Converts a gradeIndex to a grade class (gb1-gb8).
   * Grade index ranges approximately:
   * - 1-10: gb1 (Easy)
   * - 11-14: gb2 (Moderate)
   * - 15-17: gb3 (Intermediate)
   * - 18-20: gb4 (Difficult)
   * - 21-23: gb5 (Hard)
   * - 24-26: gb6 (Very Hard)
   * - 27-29: gb7 (Elite)
   * - 30+: gb8 (Super Elite)
   */
  private static gradeIndexToGradeClass(gradeIndex: number | null): string {
    if (gradeIndex === null) return ''

    if (gradeIndex <= 10) return 'gb1'
    if (gradeIndex <= 14) return 'gb2'
    if (gradeIndex <= 17) return 'gb3'
    if (gradeIndex <= 20) return 'gb4'
    if (gradeIndex <= 23) return 'gb5'
    if (gradeIndex <= 26) return 'gb6'
    if (gradeIndex <= 29) return 'gb7'
    return 'gb8'
  }

  /**
   * Parses a first ascent string like "John Smith, 2020" or "1985" into RouteHistory.
   */
  private static parseFirstAscentString(
    firstAscent: string | null,
  ): RouteHistory | null {
    if (!firstAscent) return null

    // Try to parse "Climber Name, Year" format
    const commaMatch = firstAscent.match(/^(.+?),\s*(\d{4})$/)
    if (commaMatch) {
      const climberName = commaMatch[1].trim()
      const year = commaMatch[2]
      return RouteHistory.create('FA', climberName, year)
    }

    // Try to parse just year "1985"
    const yearOnlyMatch = firstAscent.match(/^(\d{4})$/)
    if (yearOnlyMatch) {
      return RouteHistory.create('FA', 'Unknown', yearOnlyMatch[1])
    }

    // Try to find any year in the string and use the rest as climber name
    const yearMatch = firstAscent.match(/(\d{4})/)
    if (yearMatch) {
      const year = yearMatch[1]
      const climberName =
        firstAscent
          .replace(year, '')
          .replace(/[,\s]+$/, '')
          .trim() || 'Unknown'
      return RouteHistory.create('FA', climberName, year)
    }

    // If no year found, just use the string as climber name
    return RouteHistory.create('FA', firstAscent.trim(), null)
  }

  /**
   * Creates a ScrapedRoute from a TopoAnnotation (SVG data only).
   * This is an optimized method that avoids making individual API/HTML requests per route.
   *
   * Available data from SVG:
   * - Route ID, name, grade, stars, style
   * - URL for the route page
   * - Visual data (SVG path, order, zindex)
   *
   * NOT available (requires individual route scraping):
   * - Detailed route info (bolts, height, protection)
   * - History (FA, setter, dates)
   * - Beta (description, approach)
   */
  static fromTopoAnnotation(
    annotation: TopoAnnotation,
    parentAreaId: NodeId | null,
  ): ScrapedRoute {
    const routeId = NodeId.create(annotation.getId())
    const name = annotation.getName()
    const url = annotation.getUrl()

    // Create slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Grade is already parsed in TopoAnnotation
    const grade = annotation.getGrade()

    // Create basic RouteInfo from SVG data (stars and style)
    const stars = annotation.getStars()
    const style = annotation.getStyle()
    const routeInfo = RouteInfo.create({
      stars: stars ? Number.parseFloat(stars) : null,
      styleStub: style || null,
      bolts: null,
      displayHeight: null,
      heightInMeters: null,
      pitches: null,
      protection: null,
      rockType: null,
      routeType: null,
      ascentCount: null,
      length: null,
    })

    return new ScrapedRoute(
      routeId,
      name,
      slug,
      url,
      grade,
      routeInfo,
      null, // No history from SVG
      null, // No beta from SVG
      parentAreaId,
      null, // No raw API response
      null, // No raw HTML response
    )
  }

  /**
   * Enriches a ScrapedRoute with detailed data parsed from HTML.
   * Creates a new ScrapedRoute instance with merged data from SVG annotations and HTML parsing.
   *
   * HTML data includes:
   * - Bolts count, display height
   * - Stars, style (overrides SVG if more accurate)
   * - Description, alternative names
   * - Equipper name, date equipped
   * - Popularity (ascents count, score)
   * - Grade context (grading system)
   *
   * @param htmlData - Parsed route data from HTML
   * @returns New ScrapedRoute with enriched data, or same instance if no HTML data
   */
  enrichWithHtmlData(htmlData: {
    id: string
    name: string
    grade: string | null
    stars: number | null
    styleStub: string | null
    displayHeight: number | null
    bolts: number | null
    description: string | null
    equipperName: string | null
    dateEquipped: string | null
    alternativeNames: string[]
    popularity: { ascents: number; score: number } | null
    gradeContext: string | null
  }): ScrapedRoute {
    // If IDs don't match, return unchanged (safety check)
    if (htmlData.id !== this.id.toString()) {
      return this
    }

    // Merge RouteInfo with HTML data (prefer HTML data when available)
    const enrichedRouteInfo = RouteInfo.create({
      stars: htmlData.stars ?? this.routeInfo?.getStars() ?? null,
      styleStub: htmlData.styleStub ?? this.routeInfo?.getStyleStub() ?? null,
      bolts: htmlData.bolts ?? this.routeInfo?.getBolts() ?? null,
      displayHeight: htmlData.displayHeight
        ? `${htmlData.displayHeight}m`
        : this.routeInfo?.getDisplayHeight(),
      heightInMeters:
        htmlData.displayHeight ?? this.routeInfo?.getHeightInMeters() ?? null,
      pitches: this.routeInfo?.getPitches() ?? null,
      protection: this.routeInfo?.getProtection() ?? null,
      rockType: this.routeInfo?.getRockType() ?? null,
      routeType: this.routeInfo?.getRouteType() ?? null,
      ascentCount:
        htmlData.popularity?.ascents ??
        this.routeInfo?.getAscentCount() ??
        null,
      length: this.routeInfo?.getLength() ?? null,
    })

    // Create RouteHistory from HTML data
    const enrichedHistory =
      htmlData.equipperName || htmlData.dateEquipped
        ? RouteHistory.create({
            climber: htmlData.equipperName || null,
            date: htmlData.dateEquipped || null,
            year: htmlData.dateEquipped
              ? this.extractYearFromDate(htmlData.dateEquipped)
              : null,
            type: null, // Not available in HTML
            notes: null,
          })
        : this.history

    // Create RouteBeta with description and alternative names
    const enrichedBeta = htmlData.description
      ? RouteBeta.create({
          description: htmlData.description,
          approach: this.beta?.getApproach() ?? null,
          descent: this.beta?.getDescent() ?? null,
          gear: this.beta?.getGear() ?? null,
          protection: this.beta?.getProtection() ?? null,
          notes: this.beta?.getNotes() ?? null,
        })
      : this.beta

    // Create enriched grade with grade context if available
    const enrichedGrade =
      htmlData.gradeContext && htmlData.grade
        ? RouteGrade.create(
            htmlData.grade,
            null, // No grade class from HTML
            null, // No color from HTML
            htmlData.gradeContext,
          )
        : this.grade

    return new ScrapedRoute(
      this.id,
      htmlData.name || this.name, // Prefer HTML name if available
      this.slug,
      this.url,
      enrichedGrade,
      enrichedRouteInfo,
      enrichedHistory,
      enrichedBeta,
      this.parentAreaId,
      this.rawNodeResponse,
      this.rawHtmlResponse,
    )
  }

  /**
   * Helper to extract year from date string (e.g., "1994", "May 2022")
   */
  private extractYearFromDate(dateString: string): number | null {
    const yearMatch = dateString.match(/\d{4}/)
    return yearMatch ? Number.parseInt(yearMatch[0]) : null
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
