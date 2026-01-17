import { type ScoreLabel, scoreToLabel } from './score-label'

/**
 * Value Object representing a precipitation score for climbing conditions.
 * Score is on a 0-3 scale (like route quality stars).
 *
 * Precipitation thresholds:
 * - 0% probability and 0mm: Excellent (score 3)
 * - < 20% probability: Good (score 2)
 * - 20-50% probability: Moderate (score 1)
 * - 50%+ probability: Poor (score 0)
 */
export class PrecipitationScore {
  private static readonly MAX_SCORE = 3
  private static readonly EXCELLENT_THRESHOLD = 5
  private static readonly GOOD_THRESHOLD = 20
  private static readonly MODERATE_THRESHOLD = 50

  private readonly score: number
  private readonly probabilityPercent: number
  private readonly amountMm: number

  private constructor(
    score: number,
    probabilityPercent: number,
    amountMm: number,
  ) {
    this.score = score
    this.probabilityPercent = probabilityPercent
    this.amountMm = amountMm
  }

  /**
   * Calculate precipitation score from probability and amount
   * @param probabilityPercent - Precipitation probability (0-100)
   * @param amountMm - Expected precipitation amount in mm
   */
  static calculate(
    probabilityPercent: number,
    amountMm = 0,
  ): PrecipitationScore {
    const probability = Math.max(0, Math.min(100, probabilityPercent))
    const amount = Math.max(0, amountMm)

    // If there's significant rainfall predicted, reduce score further
    const amountPenalty = Math.min(1, amount / 10) // Up to 1 point penalty for 10mm+

    let baseScore: number

    if (probability <= PrecipitationScore.EXCELLENT_THRESHOLD) {
      baseScore = PrecipitationScore.MAX_SCORE
    } else if (probability <= PrecipitationScore.GOOD_THRESHOLD) {
      // Linear interpolation from 3 to 2
      const ratio =
        (probability - PrecipitationScore.EXCELLENT_THRESHOLD) /
        (PrecipitationScore.GOOD_THRESHOLD -
          PrecipitationScore.EXCELLENT_THRESHOLD)
      baseScore = PrecipitationScore.MAX_SCORE - ratio
    } else if (probability <= PrecipitationScore.MODERATE_THRESHOLD) {
      // Linear interpolation from 2 to 1
      const ratio =
        (probability - PrecipitationScore.GOOD_THRESHOLD) /
        (PrecipitationScore.MODERATE_THRESHOLD -
          PrecipitationScore.GOOD_THRESHOLD)
      baseScore = 2 - ratio
    } else {
      // Above 50%: linear decay to 0
      const ratio = Math.min(
        1,
        (probability - PrecipitationScore.MODERATE_THRESHOLD) / 50,
      )
      baseScore = 1 - ratio
    }

    const finalScore = Math.max(0, baseScore - amountPenalty)

    return new PrecipitationScore(
      Math.min(PrecipitationScore.MAX_SCORE, finalScore),
      probability,
      amount,
    )
  }

  getScore(): number {
    return this.score
  }

  getProbability(): number {
    return this.probabilityPercent
  }

  getAmount(): number {
    return this.amountMm
  }

  getLabel(): ScoreLabel {
    return scoreToLabel(this.score)
  }

  isClimbable(): boolean {
    return this.probabilityPercent < 50 && this.amountMm < 5
  }

  equals(other: PrecipitationScore): boolean {
    return (
      this.score === other.score &&
      this.probabilityPercent === other.probabilityPercent &&
      this.amountMm === other.amountMm
    )
  }

  toString(): string {
    return `PrecipitationScore(${this.score.toFixed(2)}, ${this.probabilityPercent}%, ${this.amountMm}mm, ${this.getLabel()})`
  }
}
