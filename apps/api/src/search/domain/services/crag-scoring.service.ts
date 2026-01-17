import type { Crag } from '@crags/domain/entities/crag.entity'
import type { WeightedStrategy } from '../interfaces/scoring-strategy.interface'
import type { SearchCriteria } from '../value-objects/search-criteria.vo'
import {
  type ScoreBreakdown,
  ScoredCragResult,
} from '../value-objects/scored-crag-result.vo'

/**
 * Service that coordinates multiple scoring strategies to calculate
 * a weighted total score for a crag based on search criteria
 */
export class CragScoringService {
  constructor(private readonly weightedStrategies: WeightedStrategy[]) {
    this.validateWeights()
  }

  /**
   * Calculate the total weighted score for a crag
   */
  calculateScore(crag: Crag, criteria: SearchCriteria): ScoredCragResult {
    const breakdown: ScoreBreakdown = {}
    let totalScore = 0

    // Get distance for result (from distance strategy if available)
    let distanceKm = 0

    // Apply each strategy and accumulate weighted score
    for (const { strategy, weight } of this.weightedStrategies) {
      const result = strategy.calculate(crag, criteria)
      const weightedScore = result.score * weight

      breakdown[strategy.getName()] = {
        score: result.score,
        weight: weight,
        weighted: weightedScore,
      }

      totalScore += weightedScore

      // Capture distance from distance strategy
      if (strategy.getName() === 'distance' && result.details?.distanceKm) {
        distanceKm = result.details.distanceKm as number
      }
    }

    return ScoredCragResult.create(crag, totalScore, distanceKm, breakdown)
  }

  /**
   * Validate that weights sum to approximately 1.0
   */
  private validateWeights(): void {
    const sum = this.weightedStrategies.reduce(
      (acc, { weight }) => acc + weight,
      0,
    )

    // Allow small floating point error tolerance
    if (Math.abs(sum - 1.0) > 0.001) {
      throw new Error(`weights must sum to 1.0, got ${sum}`)
    }
  }
}
