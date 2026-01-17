/**
 * Score label type for climbing conditions scores on a 0-3 scale.
 * Maps to quality ratings like route stars.
 */
export type ScoreLabel = 'excellent' | 'good' | 'moderate' | 'poor'

/**
 * Convert a numeric score (0-3) to a human-readable label.
 *
 * Thresholds:
 * - 2.5+: excellent
 * - 1.5+: good
 * - 0.5+: moderate
 * - <0.5: poor
 *
 * @param score - Score value on 0-3 scale
 * @returns Human-readable label for the score
 */
export function scoreToLabel(score: number): ScoreLabel {
  if (score >= 2.5) return 'excellent'
  if (score >= 1.5) return 'good'
  if (score >= 0.5) return 'moderate'
  return 'poor'
}
