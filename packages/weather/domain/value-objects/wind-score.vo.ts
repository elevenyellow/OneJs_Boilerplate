import { type ScoreLabel, scoreToLabel } from './score-label'

/**
 * Value Object representing a wind speed score for climbing conditions.
 * Score is on a 0-3 scale (like route quality stars).
 *
 * Wind thresholds:
 * - 0-10 km/h: Excellent (score 3) - ideal conditions
 * - 10-20 km/h: Good (score 2) - manageable
 * - 20-30 km/h: Moderate (score 1) - challenging
 * - 30+ km/h: Poor (score 0) - dangerous
 */
export class WindScore {
  private static readonly MAX_SCORE = 3
  private static readonly EXCELLENT_THRESHOLD = 10
  private static readonly GOOD_THRESHOLD = 20
  private static readonly MODERATE_THRESHOLD = 30

  private readonly score: number
  private readonly windSpeedKmh: number

  private constructor(score: number, windSpeedKmh: number) {
    this.score = score
    this.windSpeedKmh = windSpeedKmh
  }

  /**
   * Calculate wind score from wind speed in km/h
   */
  static calculate(windSpeedKmh: number): WindScore {
    if (windSpeedKmh < 0) {
      return new WindScore(WindScore.MAX_SCORE, 0)
    }

    let score: number

    if (windSpeedKmh <= WindScore.EXCELLENT_THRESHOLD) {
      score = WindScore.MAX_SCORE
    } else if (windSpeedKmh <= WindScore.GOOD_THRESHOLD) {
      // Linear interpolation from 3 to 2
      const ratio =
        (windSpeedKmh - WindScore.EXCELLENT_THRESHOLD) /
        (WindScore.GOOD_THRESHOLD - WindScore.EXCELLENT_THRESHOLD)
      score = WindScore.MAX_SCORE - ratio
    } else if (windSpeedKmh <= WindScore.MODERATE_THRESHOLD) {
      // Linear interpolation from 2 to 1
      const ratio =
        (windSpeedKmh - WindScore.GOOD_THRESHOLD) /
        (WindScore.MODERATE_THRESHOLD - WindScore.GOOD_THRESHOLD)
      score = 2 - ratio
    } else {
      // Above 30 km/h: linear decay to 0
      const ratio = Math.min(
        1,
        (windSpeedKmh - WindScore.MODERATE_THRESHOLD) / 20,
      )
      score = 1 - ratio
    }

    return new WindScore(
      Math.max(0, Math.min(WindScore.MAX_SCORE, score)),
      windSpeedKmh,
    )
  }

  getScore(): number {
    return this.score
  }

  getWindSpeed(): number {
    return this.windSpeedKmh
  }

  getLabel(): ScoreLabel {
    return scoreToLabel(this.score)
  }

  isClimbable(): boolean {
    return this.windSpeedKmh < WindScore.MODERATE_THRESHOLD
  }

  equals(other: WindScore): boolean {
    return (
      this.score === other.score && this.windSpeedKmh === other.windSpeedKmh
    )
  }

  toString(): string {
    return `WindScore(${this.score.toFixed(2)}, ${this.windSpeedKmh}km/h, ${this.getLabel()})`
  }
}
