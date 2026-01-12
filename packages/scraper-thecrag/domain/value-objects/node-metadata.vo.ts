/**
 * Value Object representing metadata for a TheCrag node.
 * Contains information about the node's position in the hierarchy,
 * price category, and various quality indicators.
 */
export class NodeMetadata {
  private constructor(
    private readonly depth: number,
    private readonly siblingLabel: number,
    private readonly priceCategory: string,
    private readonly _isTLC: boolean,
    private readonly locatedness: number,
    private readonly maxPop: number,
  ) {}

  /**
   * Creates NodeMetadata from TheCrag API response.
   * Extracts metadata from the data field of the API response.
   */
  static fromApiResponse(
    apiResponse: Record<string, unknown> | null,
  ): NodeMetadata | null {
    if (!apiResponse) return null

    const data = apiResponse.data as Record<string, unknown> | undefined
    if (!data) return null

    return NodeMetadata.create(
      (data.depth as number) ?? 0,
      (data.siblingLabel as number) ?? 0,
      (data.priceCategory as string) ?? '',
      (data.isTopLevelCrag as boolean) ?? false,
      (data.locatedness as number) ?? 0,
      (data.maxPopularity as number) ?? 0,
    )
  }

  /**
   * Creates NodeMetadata with all fields.
   */
  static create(
    depth: number,
    siblingLabel: number,
    priceCategory: string,
    isTLC: boolean,
    locatedness: number,
    maxPop: number,
  ): NodeMetadata {
    return new NodeMetadata(
      depth,
      siblingLabel,
      priceCategory,
      isTLC,
      locatedness,
      maxPop,
    )
  }

  /**
   * Returns the depth in the node hierarchy.
   * 0 = World, 1 = Continent, 2 = Country, etc.
   */
  getDepth(): number {
    return this.depth
  }

  /**
   * Returns the sibling label (order among siblings).
   */
  getSiblingLabel(): number {
    return this.siblingLabel
  }

  /**
   * Returns the price category (e.g., "Emerging", "Premium", "Standard").
   */
  getPriceCategory(): string {
    return this.priceCategory
  }

  /**
   * Returns true if this is a Top Level Crag (TLC).
   * TLCs are the main crags that appear in search results.
   */
  isTLC(): boolean {
    return this._isTLC
  }

  /**
   * Returns the locatedness score (0-100).
   * Higher values indicate better location data quality.
   */
  getLocatedness(): number {
    return this.locatedness
  }

  /**
   * Returns the maximum popularity score.
   */
  getMaxPop(): number {
    return this.maxPop
  }

  /**
   * Returns true if this is a premium crag.
   */
  isPremium(): boolean {
    return this.priceCategory.toLowerCase() === 'premium'
  }

  /**
   * Returns true if this is an emerging crag.
   */
  isEmerging(): boolean {
    return this.priceCategory.toLowerCase() === 'emerging'
  }

  /**
   * Returns true if this is a standard crag.
   */
  isStandard(): boolean {
    return this.priceCategory.toLowerCase() === 'standard'
  }

  /**
   * Returns true if the location data is considered accurate.
   * A locatedness score of 70+ is considered accurate.
   */
  hasAccurateLocation(): boolean {
    return this.locatedness >= 70
  }

  /**
   * Returns the hierarchy level name based on depth.
   */
  getHierarchyLevel(): string {
    const levels = [
      'World',
      'Continent',
      'Country',
      'Region',
      'Area',
      'Crag',
      'Sector',
    ]
    return levels[this.depth] || `Level ${this.depth}`
  }

  equals(other: NodeMetadata): boolean {
    return (
      this.depth === other.depth &&
      this.siblingLabel === other.siblingLabel &&
      this.priceCategory === other.priceCategory &&
      this._isTLC === other._isTLC &&
      this.locatedness === other.locatedness &&
      this.maxPop === other.maxPop
    )
  }

  toString(): string {
    return `Metadata(depth: ${this.depth}, category: ${this.priceCategory}, TLC: ${this._isTLC})`
  }
}
