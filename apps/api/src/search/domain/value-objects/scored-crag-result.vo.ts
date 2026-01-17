import type { Crag } from '@crags/domain/entities/crag.entity'
import type { CragWeatherEvaluation } from './crag-weather-evaluation.vo'

/**
 * Breakdown of scoring by strategy
 */
export interface ScoreBreakdownItem {
  score: number
  weight: number
  weighted: number
}

export type ScoreBreakdown = Record<string, ScoreBreakdownItem>

/**
 * Value Object representing a crag with its calculated score
 */
export class ScoredCragResult {
  private constructor(
    private readonly crag: Crag,
    private readonly totalScore: number,
    private readonly distanceKm: number,
    private readonly scoreBreakdown: ScoreBreakdown,
    private readonly weatherEvaluation: CragWeatherEvaluation | null,
  ) {}

  /**
   * Create a scored crag result
   */
  static create(
    crag: Crag,
    totalScore: number,
    distanceKm: number,
    scoreBreakdown: ScoreBreakdown,
    weatherEvaluation: CragWeatherEvaluation | null = null,
  ): ScoredCragResult {
    return new ScoredCragResult(
      crag,
      totalScore,
      distanceKm,
      scoreBreakdown,
      weatherEvaluation,
    )
  }

  /**
   * Get the crag
   */
  getCrag(): Crag {
    return this.crag
  }

  /**
   * Get the total weighted score
   */
  getTotalScore(): number {
    return this.totalScore
  }

  /**
   * Get the distance in kilometers from search origin
   */
  getDistanceKm(): number {
    return this.distanceKm
  }

  /**
   * Get the score breakdown by strategy
   */
  getScoreBreakdown(): ScoreBreakdown {
    return this.scoreBreakdown
  }

  /**
   * Get the weather evaluation for the crag
   */
  getWeatherEvaluation(): CragWeatherEvaluation | null {
    return this.weatherEvaluation
  }

  /**
   * Create a new ScoredCragResult with weather evaluation
   */
  withWeatherEvaluation(
    weatherEvaluation: CragWeatherEvaluation,
  ): ScoredCragResult {
    return new ScoredCragResult(
      this.crag,
      this.totalScore,
      this.distanceKm,
      this.scoreBreakdown,
      weatherEvaluation,
    )
  }

  /**
   * Create a new ScoredCragResult with updated total score
   */
  withTotalScore(newTotalScore: number): ScoredCragResult {
    return new ScoredCragResult(
      this.crag,
      newTotalScore,
      this.distanceKm,
      this.scoreBreakdown,
      this.weatherEvaluation,
    )
  }
}
