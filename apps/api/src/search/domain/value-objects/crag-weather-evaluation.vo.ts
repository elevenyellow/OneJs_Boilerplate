import type {
  WeatherConditionLabel,
  SectorEvaluation,
} from '../ports/crag-score-cache.port'

/**
 * Primitives representation of CragWeatherEvaluation for serialization
 */
export interface CragWeatherEvaluationPrimitives {
  cragId: string
  date: string
  totalSectors: number
  sectorsWithGoodConditions: number
  overallScore: number
  label: WeatherConditionLabel
  sectorEvaluations: SectorEvaluation[]
}

/**
 * Threshold for considering a sector has "good" conditions
 * Score range: 0-4, where 2+ is considered good
 */
const GOOD_CONDITIONS_THRESHOLD = 2.0

/**
 * Value Object representing the weather evaluation for a crag and its sectors.
 *
 * Encapsulates:
 * - Overall weather score for the crag
 * - Number of sectors with good climbing conditions
 * - Per-sector evaluation details
 * - Human-readable condition label
 *
 * Immutable: all properties are readonly.
 */
export class CragWeatherEvaluation {
  private constructor(
    private readonly cragId: string,
    private readonly date: string,
    private readonly totalSectors: number,
    private readonly sectorsWithGoodConditions: number,
    private readonly overallScore: number,
    private readonly label: WeatherConditionLabel,
    private readonly sectorEvaluations: SectorEvaluation[],
  ) {}

  /**
   * Create a CragWeatherEvaluation from sector evaluations
   */
  static create(input: {
    cragId: string
    date: string
    sectorEvaluations: SectorEvaluation[]
  }): CragWeatherEvaluation {
    const { cragId, date, sectorEvaluations } = input

    const totalSectors = sectorEvaluations.length
    const sectorsWithGoodConditions = sectorEvaluations.filter(
      (sector) => sector.hasGoodConditions,
    ).length

    // Calculate overall score as average of sector scores
    const overallScore =
      totalSectors > 0
        ? sectorEvaluations.reduce((sum, s) => sum + s.score, 0) / totalSectors
        : 0

    const label = CragWeatherEvaluation.calculateLabel(overallScore)

    return new CragWeatherEvaluation(
      cragId,
      date,
      totalSectors,
      sectorsWithGoodConditions,
      overallScore,
      label,
      sectorEvaluations,
    )
  }

  /**
   * Create from primitives (e.g., from cache)
   */
  static fromPrimitives(
    primitives: CragWeatherEvaluationPrimitives,
  ): CragWeatherEvaluation {
    return new CragWeatherEvaluation(
      primitives.cragId,
      primitives.date,
      primitives.totalSectors,
      primitives.sectorsWithGoodConditions,
      primitives.overallScore,
      primitives.label,
      primitives.sectorEvaluations,
    )
  }

  /**
   * Create a sector evaluation entry
   */
  static createSectorEvaluation(
    sectorId: string,
    score: number,
  ): SectorEvaluation {
    return {
      sectorId,
      score,
      hasGoodConditions: score >= GOOD_CONDITIONS_THRESHOLD,
    }
  }

  /**
   * Determine the condition label based on overall score
   * Score range: 0-4
   * - Excellent: >= 3.0
   * - Good: >= 2.0
   * - Fair: >= 1.0
   * - Poor: < 1.0
   */
  private static calculateLabel(score: number): WeatherConditionLabel {
    if (score >= 3.0) return 'excellent'
    if (score >= 2.0) return 'good'
    if (score >= 1.0) return 'fair'
    return 'poor'
  }

  // Getters

  getCragId(): string {
    return this.cragId
  }

  getDate(): string {
    return this.date
  }

  getTotalSectors(): number {
    return this.totalSectors
  }

  getSectorsWithGoodConditions(): number {
    return this.sectorsWithGoodConditions
  }

  getOverallScore(): number {
    return this.overallScore
  }

  getLabel(): WeatherConditionLabel {
    return this.label
  }

  getSectorEvaluations(): SectorEvaluation[] {
    return [...this.sectorEvaluations]
  }

  /**
   * Get the percentage of sectors with good conditions
   */
  getGoodConditionsPercentage(): number {
    if (this.totalSectors === 0) return 0
    return (this.sectorsWithGoodConditions / this.totalSectors) * 100
  }

  /**
   * Check if majority of sectors have good conditions
   */
  hasMajorityGoodConditions(): boolean {
    return this.getGoodConditionsPercentage() >= 50
  }

  /**
   * Convert to primitives for serialization/caching
   */
  toPrimitives(): CragWeatherEvaluationPrimitives {
    return {
      cragId: this.cragId,
      date: this.date,
      totalSectors: this.totalSectors,
      sectorsWithGoodConditions: this.sectorsWithGoodConditions,
      overallScore: this.overallScore,
      label: this.label,
      sectorEvaluations: [...this.sectorEvaluations],
    }
  }

  /**
   * Convert to DTO for API response
   */
  toDto(): {
    totalSectors: number
    sectorsWithGoodConditions: number
    overallScore: number
    label: WeatherConditionLabel
  } {
    return {
      totalSectors: this.totalSectors,
      sectorsWithGoodConditions: this.sectorsWithGoodConditions,
      overallScore: Math.round(this.overallScore * 100) / 100,
      label: this.label,
    }
  }
}
