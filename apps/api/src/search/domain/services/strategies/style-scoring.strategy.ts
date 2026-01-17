import type { Crag } from '@crags/domain/entities/crag.entity'
import {
  type IScoringStrategy,
  MAX_SCORE,
  type ScoringResult,
} from '../../interfaces/scoring-strategy.interface'
import type { SearchCriteria } from '../../value-objects/search-criteria.vo'

/**
 * Scoring strategy based on climbing style preference
 * Score is MAX_SCORE if crag's primary style matches user preference, 0 otherwise
 * If no styles specified, neutral score
 */
export class StyleScoringStrategy implements IScoringStrategy {
  getName(): string {
    return 'style'
  }

  calculate(crag: Crag, criteria: SearchCriteria): ScoringResult {
    const preferredStyles = criteria.getClimbingStyles()

    // If no style preference, neutral score (don't affect ranking)
    if (preferredStyles.length === 0) {
      return { score: MAX_SCORE / 2, details: { matched: 'any' } }
    }

    const cragStats = crag.getStats()

    // Fallback: If crag doesn't have style distribution yet, use neutral score
    // TODO: Add style distribution to CragStats once database migration is complete
    if (!('getStyleDistribution' in cragStats)) {
      // No style data available - return neutral score
      return { score: MAX_SCORE / 2, details: { noData: true } }
    }

    const styleDistribution = (
      cragStats as unknown as {
        getStyleDistribution: () => { getPrimaryStyle: () => string }
      }
    ).getStyleDistribution()

    const primaryStyle = styleDistribution.getPrimaryStyle()

    // Check if crag's primary style matches any preferred style
    const matches = preferredStyles.includes(primaryStyle)

    return {
      score: matches ? MAX_SCORE : 0,
      details: { primaryStyle, preferredStyles, matched: matches },
    }
  }
}
