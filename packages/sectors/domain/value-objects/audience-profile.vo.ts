/**
 * Audience level types
 */
export type AudienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite'

/**
 * Input for audience profile creation
 */
export interface AudienceProfileInput {
  beginnerPercentage?: number
  intermediatePercentage?: number
  advancedPercentage?: number
  elitePercentage?: number
  isFamilyFriendly?: boolean
  hasBeginner?: boolean
  hasIntermediate?: boolean
  hasAdvanced?: boolean
  hasElite?: boolean
}

/**
 * Serialized audience profile
 */
export interface AudienceProfilePrimitives {
  beginnerPercentage: number
  intermediatePercentage: number
  advancedPercentage: number
  elitePercentage: number
  primaryAudience: AudienceLevel
  suitableAudiences: AudienceLevel[]
  isFamilyFriendly: boolean
  isBeginnerFriendly: boolean
  isIntermediateFocused: boolean
  isAdvancedFocused: boolean
  hasEliteRoutes: boolean
}

/**
 * Thresholds for audience classification
 */
const AUDIENCE_THRESHOLDS = {
  BEGINNER_FRIENDLY_PERCENTAGE: 30, // >30% beginner routes = beginner-friendly
  INTERMEDIATE_FOCUSED_PERCENTAGE: 40, // >40% intermediate = intermediate-focused
  ADVANCED_FOCUSED_PERCENTAGE: 40, // >40% advanced = advanced-focused
  ELITE_ROUTES_PERCENTAGE: 10, // >10% elite = has elite routes
  SUITABLE_MINIMUM_PERCENTAGE: 15, // >15% = suitable for that audience
} as const

/**
 * Value object representing target audience profile for a sector or area.
 * Analyzes difficulty distribution to determine suitable climber levels.
 */
export class AudienceProfile {
  private readonly beginnerPercentage: number
  private readonly intermediatePercentage: number
  private readonly advancedPercentage: number
  private readonly elitePercentage: number
  private readonly familyFriendly: boolean

  private constructor(
    beginnerPercentage: number,
    intermediatePercentage: number,
    advancedPercentage: number,
    elitePercentage: number,
    familyFriendly: boolean,
  ) {
    this.beginnerPercentage = beginnerPercentage
    this.intermediatePercentage = intermediatePercentage
    this.advancedPercentage = advancedPercentage
    this.elitePercentage = elitePercentage
    this.familyFriendly = familyFriendly
  }

  /**
   * Creates audience profile from input data
   */
  static createFrom(
    data: AudienceProfileInput | null | undefined,
  ): AudienceProfile {
    if (!data) {
      return AudienceProfile.createEmpty()
    }

    return new AudienceProfile(
      data.beginnerPercentage ?? 0,
      data.intermediatePercentage ?? 0,
      data.advancedPercentage ?? 0,
      data.elitePercentage ?? 0,
      data.isFamilyFriendly ?? false,
    )
  }

  /**
   * Creates empty audience profile
   */
  static createEmpty(): AudienceProfile {
    return new AudienceProfile(0, 0, 0, 0, false)
  }

  // ============================================================================
  // BASIC METRICS
  // ============================================================================

  isEmpty(): boolean {
    return (
      this.beginnerPercentage === 0 &&
      this.intermediatePercentage === 0 &&
      this.advancedPercentage === 0 &&
      this.elitePercentage === 0
    )
  }

  getBeginnerPercentage(): number {
    return this.beginnerPercentage
  }

  getIntermediatePercentage(): number {
    return this.intermediatePercentage
  }

  getAdvancedPercentage(): number {
    return this.advancedPercentage
  }

  getElitePercentage(): number {
    return this.elitePercentage
  }

  // ============================================================================
  // AUDIENCE DETECTION
  // ============================================================================

  /**
   * Check if sector is beginner-friendly (>30% beginner routes)
   */
  isBeginnerFriendly(): boolean {
    return (
      this.beginnerPercentage >=
      AUDIENCE_THRESHOLDS.BEGINNER_FRIENDLY_PERCENTAGE
    )
  }

  /**
   * Check if sector is focused on intermediate level
   */
  isIntermediateFocused(): boolean {
    return (
      this.intermediatePercentage >=
      AUDIENCE_THRESHOLDS.INTERMEDIATE_FOCUSED_PERCENTAGE
    )
  }

  /**
   * Check if sector is focused on advanced level
   */
  isAdvancedFocused(): boolean {
    return (
      this.advancedPercentage >= AUDIENCE_THRESHOLDS.ADVANCED_FOCUSED_PERCENTAGE
    )
  }

  /**
   * Check if sector has significant elite routes (>10%)
   */
  hasEliteRoutes(): boolean {
    return this.elitePercentage >= AUDIENCE_THRESHOLDS.ELITE_ROUTES_PERCENTAGE
  }

  /**
   * Check if sector is family-friendly
   */
  isFamilyFriendly(): boolean {
    return this.familyFriendly
  }

  // ============================================================================
  // PRIMARY AUDIENCE
  // ============================================================================

  /**
   * Get primary target audience based on highest percentage
   */
  getPrimaryAudience(): AudienceLevel {
    const levels: Array<{ level: AudienceLevel; percentage: number }> = [
      { level: 'beginner', percentage: this.beginnerPercentage },
      { level: 'intermediate', percentage: this.intermediatePercentage },
      { level: 'advanced', percentage: this.advancedPercentage },
      { level: 'elite', percentage: this.elitePercentage },
    ]

    levels.sort((a, b) => b.percentage - a.percentage)
    return levels[0].percentage > 0 ? levels[0].level : 'intermediate'
  }

  /**
   * Get all suitable audiences (>15% representation)
   */
  getSuitableAudiences(): AudienceLevel[] {
    const audiences: AudienceLevel[] = []
    const threshold = AUDIENCE_THRESHOLDS.SUITABLE_MINIMUM_PERCENTAGE

    if (this.beginnerPercentage >= threshold) audiences.push('beginner')
    if (this.intermediatePercentage >= threshold) audiences.push('intermediate')
    if (this.advancedPercentage >= threshold) audiences.push('advanced')
    if (this.elitePercentage >= threshold) audiences.push('elite')

    return audiences
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  toPrimitives(): AudienceProfilePrimitives {
    return {
      beginnerPercentage: this.beginnerPercentage,
      intermediatePercentage: this.intermediatePercentage,
      advancedPercentage: this.advancedPercentage,
      elitePercentage: this.elitePercentage,
      primaryAudience: this.getPrimaryAudience(),
      suitableAudiences: this.getSuitableAudiences(),
      isFamilyFriendly: this.familyFriendly,
      isBeginnerFriendly: this.isBeginnerFriendly(),
      isIntermediateFocused: this.isIntermediateFocused(),
      isAdvancedFocused: this.isAdvancedFocused(),
      hasEliteRoutes: this.hasEliteRoutes(),
    }
  }

  // ============================================================================
  // EQUALITY
  // ============================================================================

  equals(other: AudienceProfile): boolean {
    return (
      this.beginnerPercentage === other.beginnerPercentage &&
      this.intermediatePercentage === other.intermediatePercentage &&
      this.advancedPercentage === other.advancedPercentage &&
      this.elitePercentage === other.elitePercentage &&
      this.familyFriendly === other.familyFriendly
    )
  }

  toString(): string {
    return `AudienceProfile(primary=${this.getPrimaryAudience()}, suitable=${this.getSuitableAudiences().join(',')})`
  }
}
