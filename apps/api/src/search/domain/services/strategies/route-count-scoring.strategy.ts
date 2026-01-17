import type { Crag } from '@crags/domain/entities/crag.entity'
import {
  type IScoringStrategy,
  MAX_SCORE,
  type ScoringResult,
} from '../../interfaces/scoring-strategy.interface'
import type { SearchCriteria } from '../../value-objects/search-criteria.vo'

/**
 * Scoring strategy based on route count
 * Gives bonus points to crags with more routes
 * Score scales linearly from 0 routes (0) to 200+ routes (3)
 * Uses 0-3 scale (like route stars)
 */
export class RouteCountScoringStrategy implements IScoringStrategy {
  private static readonly MAX_ROUTES_FOR_FULL_SCORE = 200

  getName(): string {
    return 'routeCount'
  }

  calculate(crag: Crag, _criteria: SearchCriteria): ScoringResult {
    const routeCount = crag.getStats().getNumberRoutes() ?? 0

    // Linear scaling: 0 routes = 0 score, 200+ routes = 3 score
    const score = Math.min(
      MAX_SCORE,
      (routeCount / RouteCountScoringStrategy.MAX_ROUTES_FOR_FULL_SCORE) *
        MAX_SCORE,
    )

    return {
      score,
      details: {
        routeCount,
      },
    }
  }
}
