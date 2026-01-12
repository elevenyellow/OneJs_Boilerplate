/**
 * Value Object representing the beta (detailed information) for a climbing route.
 * Contains description, approach information, and unique features.
 */
export class RouteBeta {
  private constructor(
    private readonly description: string | null,
    private readonly approach: string | null,
    private readonly uniqueFeatures: string | null,
  ) {}

  /**
   * Creates RouteBeta with description, approach, and unique features.
   */
  static create(
    description: string | null,
    approach: string | null,
    uniqueFeatures: string | null,
  ): RouteBeta {
    return new RouteBeta(
      description?.trim() || null,
      approach?.trim() || null,
      uniqueFeatures?.trim() || null,
    )
  }

  /**
   * Creates an empty RouteBeta.
   */
  static empty(): RouteBeta {
    return new RouteBeta(null, null, null)
  }

  /**
   * Returns the route description/beta.
   */
  getDescription(): string | null {
    return this.description
  }

  /**
   * Returns the approach information.
   */
  getApproach(): string | null {
    return this.approach
  }

  /**
   * Returns unique features of the route.
   */
  getUniqueFeatures(): string | null {
    return this.uniqueFeatures
  }

  /**
   * Returns true if the route has a description.
   */
  hasDescription(): boolean {
    return this.description !== null && this.description.length > 0
  }

  /**
   * Returns true if the route has approach information.
   */
  hasApproach(): boolean {
    return this.approach !== null && this.approach.length > 0
  }

  /**
   * Returns true if the route has unique features.
   */
  hasUniqueFeatures(): boolean {
    return this.uniqueFeatures !== null && this.uniqueFeatures.length > 0
  }

  /**
   * Returns true if the route has any beta information.
   */
  hasBeta(): boolean {
    return (
      this.hasDescription() || this.hasApproach() || this.hasUniqueFeatures()
    )
  }

  /**
   * Returns the full beta text with all sections combined.
   */
  getFullBetaText(): string {
    const parts: string[] = []

    if (this.description) {
      parts.push(this.description)
    }

    if (this.approach) {
      parts.push(`Approach: ${this.approach}`)
    }

    if (this.uniqueFeatures) {
      parts.push(`Features: ${this.uniqueFeatures}`)
    }

    return parts.join('\n\n')
  }

  /**
   * Returns a summary of the description (first 100 characters).
   */
  getDescriptionSummary(maxLength = 100): string | null {
    if (!this.description) return null

    if (this.description.length <= maxLength) {
      return this.description
    }

    return `${this.description.substring(0, maxLength)}...`
  }

  equals(other: RouteBeta): boolean {
    return (
      this.description === other.description &&
      this.approach === other.approach &&
      this.uniqueFeatures === other.uniqueFeatures
    )
  }

  toString(): string {
    const parts: string[] = []
    if (this.description) parts.push('desc')
    if (this.approach) parts.push('approach')
    if (this.uniqueFeatures) parts.push('features')
    return `RouteBeta(${parts.join(', ') || 'empty'})`
  }
}
