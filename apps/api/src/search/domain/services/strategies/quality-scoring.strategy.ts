import type { Crag } from '@crags/domain/entities/crag.entity'
import {
  type IScoringStrategy,
  MAX_SCORE,
  type ScoringResult,
} from '../../interfaces/scoring-strategy.interface'
import type { SearchCriteria } from '../../value-objects/search-criteria.vo'

/**
 * Scoring strategy based on crag quality rating
 * Score increases with crag overall score (0-3)
 * Filters out crags below minimum quality
 */
export class QualityScoringStrategy implements IScoringStrategy {
  getName(): string {
    return 'quality'
  }

  calculate(crag: Crag, criteria: SearchCriteria): ScoringResult {
    const minQualityRating = criteria.getMinQualityRating()
    const cragStats = crag.getStats()

    // Check if overall score data is available
    if (!cragStats.hasOverallScore()) {
      // No quality data available - return neutral score
      return { score: MAX_SCORE / 2, details: { noData: true } }
    }

    const cragScore = cragStats.getOverallScore()

    // If crag is below minimum quality, return 0 (filtered out)
    if (cragScore < minQualityRating) {
      return { score: 0, details: { cragScore, belowMinimum: true } }
    }

    // Score is proportional to crag overall score (0-3)
    // Return actual score (already on 0-3 scale)
    return {
      score: cragScore,
      details: { cragScore, minRequired: minQualityRating },
    }
  }
}
