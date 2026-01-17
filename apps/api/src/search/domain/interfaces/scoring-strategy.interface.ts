import type { Crag } from '@crags/domain/entities/crag.entity'
import type { SearchCriteria } from '../value-objects/search-criteria.vo'

/**
 * Maximum score value (3 stars scale, like route quality)
 */
export const MAX_SCORE = 3

/**
 * Result of a scoring calculation
 */
export interface ScoringResult {
  /**
   * Score value (0-3, matching the route stars scale)
   * 0 = not relevant, 1 = acceptable, 2 = good, 3 = excellent
   */
  score: number

  /**
   * Optional details about the calculation
   */
  details?: Record<string, unknown>
}

/**
 * Interface for scoring strategies
 * Each strategy calculates a score (0-3) for a crag based on search criteria
 * The 0-3 scale matches the route quality stars system for consistency
 */
export interface IScoringStrategy {
  /**
   * Calculate score for a crag based on search criteria
   * @param crag - The crag to score
   * @param criteria - The search criteria to evaluate against
   * @returns Scoring result with score 0-3
   */
  calculate(crag: Crag, criteria: SearchCriteria): ScoringResult

  /**
   * Get the name of this strategy (for debugging/reporting)
   */
  getName(): string
}

/**
 * Strategy configuration with weight
 */
export interface WeightedStrategy {
  strategy: IScoringStrategy
  weight: number
}
