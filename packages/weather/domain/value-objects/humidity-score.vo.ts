import { type ScoreLabel, scoreToLabel } from './score-label'

/**
 * Value Object representing a humidity score for climbing conditions.
 * Score is on a 0-3 scale (like route quality stars).
 *
 * Humidity affects rock friction - too humid makes rock slippery.
 *
 * Humidity thresholds:
 * - 30-60%: Excellent (score 3) - optimal friction
 * - 60-70%: Good (score 2) - acceptable
 * - 70-80%: Moderate (score 1) - slightly slippery
 * - 80%+: Poor (score 0) - slippery rock
 * - <30%: Good (score 2.5) - very dry, skin may crack
 */
export class HumidityScore {
  private static readonly MAX_SCORE = 3
  private static readonly OPTIMAL_MIN = 30
  private static readonly OPTIMAL_MAX = 60
  private static readonly GOOD_THRESHOLD = 70
  private static readonly MODERATE_THRESHOLD = 80

  private readonly score: number
  private readonly humidityPercent: number

  private constructor(score: number, humidityPercent: number) {
    this.score = score
    this.humidityPercent = humidityPercent
  }

  /**
   * Calculate humidity score from relative humidity percentage
   * @param humidityPercent - Relative humidity (0-100)
   */
  static calculate(humidityPercent: number): HumidityScore {
    const humidity = Math.max(0, Math.min(100, humidityPercent))

    let score: number

    if (humidity < HumidityScore.OPTIMAL_MIN) {
      // Too dry - slightly lower score but still good
      score = 2.5
    } else if (humidity <= HumidityScore.OPTIMAL_MAX) {
      // Optimal range
      score = HumidityScore.MAX_SCORE
    } else if (humidity <= HumidityScore.GOOD_THRESHOLD) {
      // Linear interpolation from 3 to 2
      const ratio =
        (humidity - HumidityScore.OPTIMAL_MAX) /
        (HumidityScore.GOOD_THRESHOLD - HumidityScore.OPTIMAL_MAX)
      score = HumidityScore.MAX_SCORE - ratio
    } else if (humidity <= HumidityScore.MODERATE_THRESHOLD) {
      // Linear interpolation from 2 to 1
      const ratio =
        (humidity - HumidityScore.GOOD_THRESHOLD) /
        (HumidityScore.MODERATE_THRESHOLD - HumidityScore.GOOD_THRESHOLD)
      score = 2 - ratio
    } else {
      // Above 80%: linear decay to 0
      const ratio = Math.min(
        1,
        (humidity - HumidityScore.MODERATE_THRESHOLD) / 20,
      )
      score = 1 - ratio
    }

    return new HumidityScore(
      Math.max(0, Math.min(HumidityScore.MAX_SCORE, score)),
      humidity,
    )
  }

  getScore(): number {
    return this.score
  }

  getHumidity(): number {
    return this.humidityPercent
  }

  getLabel(): ScoreLabel {
    return scoreToLabel(this.score)
  }

  isOptimalFriction(): boolean {
    return (
      this.humidityPercent >= HumidityScore.OPTIMAL_MIN &&
      this.humidityPercent <= HumidityScore.OPTIMAL_MAX
    )
  }

  equals(other: HumidityScore): boolean {
    return (
      this.score === other.score &&
      this.humidityPercent === other.humidityPercent
    )
  }

  toString(): string {
    return `HumidityScore(${this.score.toFixed(2)}, ${this.humidityPercent}%, ${this.getLabel()})`
  }
}
