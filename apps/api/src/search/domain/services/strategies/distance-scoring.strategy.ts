import type { Crag } from '@crags/domain/entities/crag.entity'
import {
  type IScoringStrategy,
  MAX_SCORE,
  type ScoringResult,
} from '../../interfaces/scoring-strategy.interface'
import type { SearchCriteria } from '../../value-objects/search-criteria.vo'

/**
 * Scoring strategy based on distance from search origin
 * Score decreases linearly from 3 (at origin) to 0 (at radius limit)
 * Uses Coordinates.distanceTo() method with Haversine formula
 */
export class DistanceScoringStrategy implements IScoringStrategy {
  getName(): string {
    return 'distance'
  }

  calculate(crag: Crag, criteria: SearchCriteria): ScoringResult {
    const cragCoords = crag.getCoordinates()
    const searchCoords = criteria.getCoordinates()

    // Calculate distance using Coordinates.distanceTo() (Haversine formula)
    const distanceKm = cragCoords.distanceTo(searchCoords)

    // Handle crags without coordinates
    if (distanceKm === null) {
      return { score: 0, details: { distanceKm: null } }
    }

    const radiusKm = criteria.getRadiusKm()

    // Linear scoring: 3 at 0km, 0 at radiusKm (0-3 scale like route stars)
    const score = Math.max(
      0,
      Math.min(MAX_SCORE, MAX_SCORE * (1 - distanceKm / radiusKm)),
    )

    return {
      score,
      details: { distanceKm },
    }
  }
}
