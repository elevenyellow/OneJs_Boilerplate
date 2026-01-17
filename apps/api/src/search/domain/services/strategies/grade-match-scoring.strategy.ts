import type { Crag } from '@crags/domain/entities/crag.entity'
import {
  type IScoringStrategy,
  MAX_SCORE,
  type ScoringResult,
} from '../../interfaces/scoring-strategy.interface'
import type { SearchCriteria } from '../../value-objects/search-criteria.vo'

/**
 * Scoring strategy based on grade range match
 * Score is proportional to the percentage of routes in the desired grade range
 * Uses 0-3 scale (like route stars)
 */
export class GradeMatchScoringStrategy implements IScoringStrategy {
  getName(): string {
    return 'gradeMatch'
  }

  calculate(crag: Crag, criteria: SearchCriteria): ScoringResult {
    const gradeRange = criteria.getGradeRange()
    const gbRoutes = crag.getGradeDistribution().getGbRoutes()

    // Calculate percentage of routes in the desired grade range (0-100)
    const percentageInRange = gradeRange.getPercentageInRange(gbRoutes)

    // Convert percentage to 0-3 scale
    const score = Math.min(
      MAX_SCORE,
      Math.max(0, (percentageInRange / 100) * MAX_SCORE),
    )

    return {
      score,
      details: {
        percentageInRange,
      },
    }
  }
}
