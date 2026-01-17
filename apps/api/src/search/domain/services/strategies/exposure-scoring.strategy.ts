import type { Crag } from '@crags/domain/entities/crag.entity'
import {
  type IScoringStrategy,
  MAX_SCORE,
  type ScoringResult,
} from '../../interfaces/scoring-strategy.interface'
import { isExposureCompatible } from '../../types/seasonality.types'
import type { SearchCriteria } from '../../value-objects/search-criteria.vo'

/**
 * Scoring strategy based on exposure preference (sun/shade)
 * Score is MAX_SCORE if preference matches, 0 if not specified
 *
 * Uses centralized isExposureCompatible() for consistency with filtering logic.
 */
export class ExposureScoringStrategy implements IScoringStrategy {
  getName(): string {
    return 'exposure'
  }

  calculate(crag: Crag, criteria: SearchCriteria): ScoringResult {
    const exposurePreference = criteria.getExposurePreference()

    // If no preference, neutral score (don't affect ranking)
    if (exposurePreference === 'any') {
      return { score: MAX_SCORE / 2, details: { matched: 'any' } }
    }

    // Use centralized exposure matching logic
    // IMPORTANT: Use getGoodMonths() which returns month numbers (1-12),
    // NOT getMonths() which returns raw seasonality scores
    const goodMonths = crag.getSeasonality().getGoodMonths()
    const isCompatible = isExposureCompatible(goodMonths, exposurePreference)

    return {
      score: isCompatible ? MAX_SCORE : 0,
      details: { matched: isCompatible, exposurePreference, goodMonths },
    }
  }
}
