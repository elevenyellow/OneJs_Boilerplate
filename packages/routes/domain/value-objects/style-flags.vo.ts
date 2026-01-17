/**
 * Climbing style flags represented as a bitmask.
 *
 * Each climbing style is represented by a single bit:
 * - Bit 0 (1):   Sport
 * - Bit 1 (2):   Trad
 * - Bit 2 (4):   Boulder
 * - Bit 3 (8):   Aid
 * - Bit 4 (16):  Alpine
 * - Bit 5 (32):  Mixed
 * - Bit 6 (64):  Ice
 * - Bit 7 (128): TopRope
 *
 * Example: A route that is both Sport and Trad would have styleFlags = 3 (1 + 2)
 */

/**
 * Climbing style enum with bit values
 */
export enum ClimbingStyle {
  SPORT = 1,
  TRAD = 2,
  BOULDER = 4,
  AID = 8,
  ALPINE = 16,
  MIXED = 32,
  ICE = 64,
  TOP_ROPE = 128,
}

/**
 * Human-readable labels for each climbing style
 */
const STYLE_LABELS: Record<ClimbingStyle, string> = {
  [ClimbingStyle.SPORT]: 'Sport',
  [ClimbingStyle.TRAD]: 'Trad',
  [ClimbingStyle.BOULDER]: 'Boulder',
  [ClimbingStyle.AID]: 'Aid',
  [ClimbingStyle.ALPINE]: 'Alpine',
  [ClimbingStyle.MIXED]: 'Mixed',
  [ClimbingStyle.ICE]: 'Ice',
  [ClimbingStyle.TOP_ROPE]: 'Top Rope',
}

/**
 * All climbing styles in priority order (for getPrimaryStyle)
 */
const STYLES_BY_PRIORITY: ClimbingStyle[] = [
  ClimbingStyle.SPORT,
  ClimbingStyle.TRAD,
  ClimbingStyle.BOULDER,
  ClimbingStyle.AID,
  ClimbingStyle.ALPINE,
  ClimbingStyle.MIXED,
  ClimbingStyle.ICE,
  ClimbingStyle.TOP_ROPE,
]

/**
 * Input data from scraper (API format with IsSport, IsTrad, etc.)
 */
export interface StyleFlagsData {
  IsSport?: number
  IsTrad?: number
  IsBoulder?: number
  IsAid?: number
  IsAlpine?: number
  IsMixed?: number
  IsIce?: number
  IsTopRope?: number
  [key: string]: number | undefined
}

export class StyleFlags {
  private readonly value: number

  private constructor(value: number) {
    this.value = value
  }

  /**
   * Create from a numeric bitmask value (from database)
   */
  static createFrom(value: number | null | undefined): StyleFlags {
    return new StyleFlags(value ?? 0)
  }

  /**
   * Create from scraper data format (IsSport, IsTrad, etc.)
   */
  static createFromData(data: StyleFlagsData | null | undefined): StyleFlags {
    if (!data) return StyleFlags.empty()

    let value = 0
    if (data.IsSport) value |= ClimbingStyle.SPORT
    if (data.IsTrad) value |= ClimbingStyle.TRAD
    if (data.IsBoulder) value |= ClimbingStyle.BOULDER
    if (data.IsAid) value |= ClimbingStyle.AID
    if (data.IsAlpine) value |= ClimbingStyle.ALPINE
    if (data.IsMixed) value |= ClimbingStyle.MIXED
    if (data.IsIce) value |= ClimbingStyle.ICE
    if (data.IsTopRope) value |= ClimbingStyle.TOP_ROPE

    return new StyleFlags(value)
  }

  /**
   * Create from individual boolean values
   */
  static createFromBooleans(
    isSport: boolean,
    isTrad: boolean,
    isBoulder: boolean,
    isAid: boolean,
    isAlpine: boolean,
    isMixed: boolean,
    isIce: boolean,
    isTopRope: boolean,
  ): StyleFlags {
    let value = 0
    if (isSport) value |= ClimbingStyle.SPORT
    if (isTrad) value |= ClimbingStyle.TRAD
    if (isBoulder) value |= ClimbingStyle.BOULDER
    if (isAid) value |= ClimbingStyle.AID
    if (isAlpine) value |= ClimbingStyle.ALPINE
    if (isMixed) value |= ClimbingStyle.MIXED
    if (isIce) value |= ClimbingStyle.ICE
    if (isTopRope) value |= ClimbingStyle.TOP_ROPE

    return new StyleFlags(value)
  }

  /**
   * Create empty flags (no styles)
   */
  static empty(): StyleFlags {
    return new StyleFlags(0)
  }

  /**
   * Get the raw numeric value (for database storage)
   */
  getValue(): number {
    return this.value
  }

  /**
   * Check if a specific style is set
   */
  hasStyle(style: ClimbingStyle): boolean {
    return (this.value & style) !== 0
  }

  /**
   * Individual style getters for backward compatibility
   */
  isSport(): boolean {
    return this.hasStyle(ClimbingStyle.SPORT)
  }

  isTrad(): boolean {
    return this.hasStyle(ClimbingStyle.TRAD)
  }

  isBoulder(): boolean {
    return this.hasStyle(ClimbingStyle.BOULDER)
  }

  isAid(): boolean {
    return this.hasStyle(ClimbingStyle.AID)
  }

  isAlpine(): boolean {
    return this.hasStyle(ClimbingStyle.ALPINE)
  }

  isMixed(): boolean {
    return this.hasStyle(ClimbingStyle.MIXED)
  }

  isIce(): boolean {
    return this.hasStyle(ClimbingStyle.ICE)
  }

  isTopRope(): boolean {
    return this.hasStyle(ClimbingStyle.TOP_ROPE)
  }

  /**
   * Get the primary (first) style based on priority order
   */
  getPrimaryStyle(): string {
    for (const style of STYLES_BY_PRIORITY) {
      if (this.hasStyle(style)) {
        return STYLE_LABELS[style]
      }
    }
    return 'Unknown'
  }

  /**
   * Get all active styles as human-readable labels
   */
  getActiveStyles(): string[] {
    const styles: string[] = []
    for (const style of STYLES_BY_PRIORITY) {
      if (this.hasStyle(style)) {
        styles.push(STYLE_LABELS[style])
      }
    }
    return styles
  }

  /**
   * Get count of active styles
   */
  getStyleCount(): number {
    let count = 0
    let v = this.value
    while (v) {
      count += v & 1
      v >>= 1
    }
    return count
  }

  /**
   * Check if route has multiple styles
   */
  isMultiStyle(): boolean {
    return this.getStyleCount() > 1
  }

  /**
   * Check if no styles are set
   */
  isEmpty(): boolean {
    return this.value === 0
  }

  equals(other: StyleFlags): boolean {
    return this.value === other.value
  }

  toString(): string {
    const styles = this.getActiveStyles()
    return styles.length > 0 ? styles.join(', ') : 'No style'
  }
}
