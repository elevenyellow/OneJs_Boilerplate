import type { Crag } from '@crags/domain/entities/crag.entity'
import {
  SEASON_PREFERENCE_MONTHS,
  SeasonPreference,
} from '../../types/seasonality.types'
import {
  type IScoringStrategy,
  MAX_SCORE,
  type ScoringResult,
} from '../../interfaces/scoring-strategy.interface'
import type { SearchCriteria } from '../../value-objects/search-criteria.vo'

/**
 * Scoring strategy based on seasonality match
 * Score is proportional to the overlap between crag's good months and desired season
 * Uses 0-3 scale (like route stars)
 */
export class SeasonalityScoringStrategy implements IScoringStrategy {
  getName(): string {
    return 'seasonality'
  }

  calculate(crag: Crag, criteria: SearchCriteria): ScoringResult {
    const seasonPreference = criteria.getSeasonPreference()

    // ANY season always scores 3 (maximum)
    if (seasonPreference === SeasonPreference.ANY) {
      return {
        score: MAX_SCORE,
        details: {
          matchingMonths: 12,
        },
      }
    }

    // Get the good months for the crag (computed from scores using dynamic threshold)
    const cragGoodMonths = crag.getSeasonality().getGoodMonths()
    const preferredMonths = SEASON_PREFERENCE_MONTHS[seasonPreference]

    // Count how many crag good months overlap with preferred season
    const matchingMonths = cragGoodMonths.filter((month) =>
      preferredMonths.includes(month),
    ).length

    // Calculate score as ratio of season coverage on 0-3 scale
    // If season has 4 months and crag has 2 matching = 50% = 1.5
    const ratio =
      preferredMonths.length > 0 ? matchingMonths / preferredMonths.length : 0

    return {
      score: Math.min(MAX_SCORE, Math.max(0, ratio * MAX_SCORE)),
      details: {
        matchingMonths,
      },
    }
  }
}
