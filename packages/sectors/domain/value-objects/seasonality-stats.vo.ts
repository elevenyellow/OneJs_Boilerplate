/**
 * Month names in Spanish
 */
const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const

/**
 * Season definitions by month numbers
 */
const SEASONS = {
  WINTER: [12, 1, 2], // Dec, Jan, Feb
  SPRING: [3, 4, 5], // Mar, Apr, May
  SUMMER: [6, 7, 8], // Jun, Jul, Aug
  AUTUMN: [9, 10, 11], // Sep, Oct, Nov
} as const

/**
 * Serialized seasonality stats
 */
export interface SeasonalityStatsPrimitives {
  bestMonths: number[]
  monthsAvailable: number
  bestSeasonLabel: string
  bestMonthNames: string[]
  isYearRound: boolean
  isWinterSector: boolean
  isSummerSector: boolean
  isSpringAutumnSector: boolean
}

/**
 * Value object representing seasonality statistics for a sector or area.
 * Tracks best climbing months and season classifications.
 */
export class SeasonalityStats {
  private readonly months: number[]

  private constructor(months: number[]) {
    // Sort and deduplicate months
    this.months = [...new Set(months)].sort((a, b) => a - b)
  }

  /**
   * Creates seasonality stats from month array
   * @param months Array of month numbers (1=January, 12=December)
   */
  static createFrom(months: number[] | null | undefined): SeasonalityStats {
    if (!months || months.length === 0) {
      return new SeasonalityStats([])
    }
    // Filter valid months (1-12)
    const validMonths = months.filter((m) => m >= 1 && m <= 12)
    return new SeasonalityStats(validMonths)
  }

  /**
   * Creates empty seasonality stats
   */
  static createEmpty(): SeasonalityStats {
    return new SeasonalityStats([])
  }

  // ============================================================================
  // BASIC METRICS
  // ============================================================================

  isEmpty(): boolean {
    return this.months.length === 0
  }

  getBestMonths(): number[] {
    return [...this.months]
  }

  getMonthsAvailable(): number {
    return this.months.length
  }

  // ============================================================================
  // MONTH CHECKS
  // ============================================================================

  /**
   * Check if a specific month is available
   * @param month Month number (1-12)
   */
  isMonthAvailable(month: number): boolean {
    return this.months.includes(month)
  }

  /**
   * Get human-readable month names for best months
   */
  getBestMonthNames(): string[] {
    return this.months.map((m) => MONTH_NAMES[m - 1])
  }

  // ============================================================================
  // SEASON DETECTION
  // ============================================================================

  /**
   * Check if sector is available year-round
   */
  isYearRound(): boolean {
    return this.months.length >= 11 // 11 or 12 months
  }

  /**
   * Check if sector is primarily a winter sector
   */
  isWinterSector(): boolean {
    if (this.isEmpty()) return false
    const winterMonths = this.months.filter((m) =>
      SEASONS.WINTER.includes(m as 12 | 1 | 2),
    )
    return (
      winterMonths.length >= 2 &&
      winterMonths.length / this.months.length >= 0.5
    )
  }

  /**
   * Check if sector is primarily a summer sector
   */
  isSummerSector(): boolean {
    if (this.isEmpty()) return false
    const summerMonths = this.months.filter((m) =>
      SEASONS.SUMMER.includes(m as 6 | 7 | 8),
    )
    return (
      summerMonths.length >= 2 &&
      summerMonths.length / this.months.length >= 0.5
    )
  }

  /**
   * Check if sector is primarily spring/autumn
   */
  isSpringAutumnSector(): boolean {
    if (this.isEmpty()) return false
    const springAutumnMonths = this.months.filter(
      (m) =>
        SEASONS.SPRING.includes(m as 3 | 4 | 5) ||
        SEASONS.AUTUMN.includes(m as 9 | 10 | 11),
    )
    return springAutumnMonths.length >= 4 && !this.isYearRound()
  }

  /**
   * Get best season label in Spanish
   */
  getBestSeasonLabel(): string {
    if (this.isEmpty()) return 'Sin datos'
    if (this.isYearRound()) return 'Todo el año'

    const seasons: string[] = []

    const hasWinter = this.months.some((m) =>
      SEASONS.WINTER.includes(m as 12 | 1 | 2),
    )
    const hasSpring = this.months.some((m) =>
      SEASONS.SPRING.includes(m as 3 | 4 | 5),
    )
    const hasSummer = this.months.some((m) =>
      SEASONS.SUMMER.includes(m as 6 | 7 | 8),
    )
    const hasAutumn = this.months.some((m) =>
      SEASONS.AUTUMN.includes(m as 9 | 10 | 11),
    )

    if (hasSpring) seasons.push('Primavera')
    if (hasSummer) seasons.push('Verano')
    if (hasAutumn) seasons.push('Otoño')
    if (hasWinter) seasons.push('Invierno')

    if (seasons.length === 0) return 'Sin datos'
    if (seasons.length === 4) return 'Todo el año'

    return seasons.join(' - ')
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  toPrimitives(): SeasonalityStatsPrimitives {
    return {
      bestMonths: this.getBestMonths(),
      monthsAvailable: this.getMonthsAvailable(),
      bestSeasonLabel: this.getBestSeasonLabel(),
      bestMonthNames: this.getBestMonthNames(),
      isYearRound: this.isYearRound(),
      isWinterSector: this.isWinterSector(),
      isSummerSector: this.isSummerSector(),
      isSpringAutumnSector: this.isSpringAutumnSector(),
    }
  }

  // ============================================================================
  // EQUALITY
  // ============================================================================

  equals(other: SeasonalityStats): boolean {
    if (this.months.length !== other.months.length) return false
    return this.months.every((m, i) => m === other.months[i])
  }

  toString(): string {
    return `SeasonalityStats(months=${this.months.join(',')}, season=${this.getBestSeasonLabel()})`
  }
}
