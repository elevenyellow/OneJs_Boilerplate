/**
 * Value Object representing the beta (detailed information) for a climbing area.
 * Contains summary (unique features), description, and approach information.
 * Data is extracted from the TheCrag API 'beta' array and 'unique' field.
 */
export class AreaBeta {
  private constructor(
    private readonly summary: string | null,
    private readonly description: string | null,
    private readonly approach: string | null,
  ) {}

  /**
   * Creates AreaBeta with summary, description, and approach.
   */
  static create(
    summary: string | null,
    description: string | null,
    approach: string | null,
  ): AreaBeta {
    return new AreaBeta(
      summary?.trim() || null,
      description?.trim() || null,
      approach?.trim() || null,
    )
  }

  /**
   * Creates an empty AreaBeta.
   */
  static empty(): AreaBeta {
    return new AreaBeta(null, null, null)
  }

  /**
   * Creates AreaBeta from TheCrag API response.
   * Extracts unique (summary), and beta array entries for description and approach.
   */
  static fromApiResponse(
    apiResponse: Record<string, unknown> | null,
  ): AreaBeta {
    if (!apiResponse) return AreaBeta.empty()
    const data = apiResponse.data as Record<string, unknown> | undefined
    if (!data) return AreaBeta.empty()

    const summary = (data.unique as string) ?? null
    const betaArray = data.beta as
      | Array<{ name?: string; markdown?: string }>
      | undefined

    let description: string | null = null
    let approach: string | null = null

    if (betaArray && Array.isArray(betaArray)) {
      const descEntry = betaArray.find((b) => b.name === 'Description')
      const approachEntry = betaArray.find((b) => b.name === 'Approach')
      description = descEntry?.markdown ?? null
      approach = approachEntry?.markdown ?? null
    }

    return AreaBeta.create(summary, description, approach)
  }

  /**
   * Returns the area summary (unique features).
   * This comes from the 'unique' field or 'Unique Features And Strengths' beta entry.
   */
  getSummary(): string | null {
    return this.summary
  }

  /**
   * Returns the area description.
   * This comes from the 'Description' beta entry.
   */
  getDescription(): string | null {
    return this.description
  }

  /**
   * Returns the approach information.
   * This comes from the 'Approach' beta entry.
   */
  getApproach(): string | null {
    return this.approach
  }

  /**
   * Returns true if the area has a summary.
   */
  hasSummary(): boolean {
    return this.summary !== null && this.summary.length > 0
  }

  /**
   * Returns true if the area has a description.
   */
  hasDescription(): boolean {
    return this.description !== null && this.description.length > 0
  }

  /**
   * Returns true if the area has approach information.
   */
  hasApproach(): boolean {
    return this.approach !== null && this.approach.length > 0
  }

  /**
   * Returns true if the area has any beta information.
   */
  hasBeta(): boolean {
    return this.hasSummary() || this.hasDescription() || this.hasApproach()
  }

  /**
   * Returns the full beta text with all sections combined.
   */
  getFullBetaText(): string {
    const parts: string[] = []

    if (this.summary) {
      parts.push(this.summary)
    }

    if (this.description) {
      parts.push(this.description)
    }

    if (this.approach) {
      parts.push(`Approach: ${this.approach}`)
    }

    return parts.join('\n\n')
  }

  /**
   * Returns a truncated summary (first N characters).
   */
  getSummaryTruncated(maxLength = 100): string | null {
    if (!this.summary) return null

    if (this.summary.length <= maxLength) {
      return this.summary
    }

    return `${this.summary.substring(0, maxLength)}...`
  }

  /**
   * Returns a truncated description (first N characters).
   */
  getDescriptionTruncated(maxLength = 200): string | null {
    if (!this.description) return null

    if (this.description.length <= maxLength) {
      return this.description
    }

    return `${this.description.substring(0, maxLength)}...`
  }

  equals(other: AreaBeta): boolean {
    return (
      this.summary === other.summary &&
      this.description === other.description &&
      this.approach === other.approach
    )
  }

  toString(): string {
    const parts: string[] = []
    if (this.summary) parts.push('summary')
    if (this.description) parts.push('desc')
    if (this.approach) parts.push('approach')
    return `AreaBeta(${parts.join(', ') || 'empty'})`
  }

  toDto(): {
    summary: string | null
    description: string | null
    approach: string | null
  } {
    return {
      summary: this.summary,
      description: this.description,
      approach: this.approach,
    }
  }
}
