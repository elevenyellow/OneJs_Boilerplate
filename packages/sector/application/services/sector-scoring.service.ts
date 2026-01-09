import { Injectable } from '@OneJs/core'
import { Coordinates, Grade } from '@climb-zone/shared'
import type { SearchSectorResult } from '@sector/domain/dtos/search-sectors.dto'
import type { SectorEntity } from '@sector/domain/entities/sector.entity'

export type SeasonType = 'summer' | 'winter' | 'spring' | 'autumn'
export type OrientationPreference = 'sun' | 'shade' | 'any'

interface ScoringContext {
  userLocation: Coordinates
  minGradeIndex: number
  maxGradeIndex: number
  orientationPreference: OrientationPreference
}

/**
 * Service for calculating sector relevance scores based on multiple factors
 */
@Injectable()
export class SectorScoringService {
  /**
   * Calculate relevance score for a sector
   * Total score: 0-100 points
   * - Grade match: 40 points
   * - Distance: 20 points
   * - Orientation/Seasonality: 15 points
   * - Popularity: 10 points
   * - Route count: 10 points
   * - Quality (photos/topos): 5 points
   */
  scoreSector(
    sector: SectorEntity,
    context: ScoringContext,
  ): SearchSectorResult {
    const distance = sector.distanceTo(context.userLocation) ?? 9999
    const routesInUserRange = this.countRoutesInRange(
      sector,
      context.minGradeIndex,
      context.maxGradeIndex,
    )

    // Calculate individual scores
    const gradeMatchScore = this.calculateGradeScore(
      sector,
      context.minGradeIndex,
      context.maxGradeIndex,
      routesInUserRange,
    )
    const distanceScore = this.calculateDistanceScore(distance)
    const orientationScore = this.calculateOrientationScore(
      sector,
      context.orientationPreference,
    )
    const popularityScore = this.calculatePopularityScore(sector)
    const routeCountScore = this.calculateRouteCountScore(sector)
    const qualityScore = this.calculateQualityScore(sector)

    const totalScore =
      gradeMatchScore +
      distanceScore +
      orientationScore +
      popularityScore +
      routeCountScore +
      qualityScore

    const matchReasons = this.generateMatchReasons(
      sector,
      distance,
      routesInUserRange,
      context,
    )

    return {
      sector: sector.toJSON(),
      relevanceScore: Math.round(totalScore * 10) / 10,
      distance: Math.round(distance * 10) / 10,
      routesInUserRange,
      matchReasons,
      scoringBreakdown: {
        gradeMatch: Math.round(gradeMatchScore * 10) / 10,
        distance: Math.round(distanceScore * 10) / 10,
        orientation: Math.round(orientationScore * 10) / 10,
        popularity: Math.round(popularityScore * 10) / 10,
        routeCount: Math.round(routeCountScore * 10) / 10,
        quality: Math.round(qualityScore * 10) / 10,
      },
    }
  }

  /**
   * Grade match score (0-40 points)
   * Based on percentage of routes in user's range
   */
  private calculateGradeScore(
    sector: SectorEntity,
    minGradeIndex: number,
    maxGradeIndex: number,
    routesInRange: number,
  ): number {
    const totalRoutes = sector.stats.routeCount
    if (totalRoutes === 0) return 0

    // Percentage of routes in user's range
    const percentage = routesInRange / totalRoutes

    // Full 40 points if 50%+ routes are in range
    // Linear scale from 0-40 points
    return Math.min(40, percentage * 80)
  }

  /**
   * Distance score (0-20 points)
   * Closer = better
   */
  private calculateDistanceScore(distance: number): number {
    if (distance >= 100) return 0
    if (distance <= 10) return 20

    // Linear decay from 20 points at 10km to 0 points at 100km
    return 20 * (1 - (distance - 10) / 90)
  }

  /**
   * Orientation score (0-15 points)
   * Matches sector orientation with preferred orientation (based on weather)
   */
  private calculateOrientationScore(
    sector: SectorEntity,
    preferredOrientation: OrientationPreference,
  ): number {
    const orientationStr = sector.orientation?.toString() ?? ''
    const hasOrientationData = orientationStr.length > 0

    // No preference or no data: neutral score
    if (preferredOrientation === 'any') {
      return 7
    }

    // No orientation data available: neutral score (don't penalize)
    if (!hasOrientationData) {
      return 7
    }

    let score = 0

    if (preferredOrientation === 'shade') {
      // Hot weather: prefer north-facing sectors
      if (['N', 'NE', 'NW'].some((o) => orientationStr.includes(o))) {
        score += 10
      } else if (['E', 'W'].some((o) => orientationStr.includes(o))) {
        score += 5 // partial shade
      }
      if (sector.sunExposure?.isShaded()) {
        score += 5
      }
    } else if (preferredOrientation === 'sun') {
      // Cold weather: prefer south-facing sectors
      if (['S', 'SE', 'SW'].some((o) => orientationStr.includes(o))) {
        score += 10
      } else if (['E', 'W'].some((o) => orientationStr.includes(o))) {
        score += 5 // partial sun
      }
      if (sector.sunExposure?.toString() === 'Sun') {
        score += 5
      }
    }

    return Math.min(15, score)
  }

  /**
   * Popularity score (0-10 points)
   * Based on favorites count
   */
  private calculatePopularityScore(sector: SectorEntity): number {
    const favorites = sector.totalFavorites ?? 0

    if (favorites >= 100) return 10
    if (favorites >= 50) return 8
    if (favorites >= 20) return 6
    if (favorites >= 10) return 4
    if (favorites >= 5) return 2

    return 0
  }

  /**
   * Route count score (0-10 points)
   * More routes = more options
   */
  private calculateRouteCountScore(sector: SectorEntity): number {
    const routeCount = sector.stats.routeCount

    if (routeCount >= 100) return 10
    if (routeCount >= 50) return 8
    if (routeCount >= 30) return 6
    if (routeCount >= 15) return 4
    if (routeCount >= 5) return 2

    return 0
  }

  /**
   * Quality score (0-5 points)
   * Based on photos, topos, and other quality indicators
   */
  private calculateQualityScore(sector: SectorEntity): number {
    let score = 0

    if (sector.hasTopos()) score += 2
    if (sector.hasPhotos()) score += 2
    if (sector.isTLC) score += 1 // Top Level Crag

    return Math.min(5, score)
  }

  /**
   * Count routes in user's grade range using gradeDistribution
   */
  private countRoutesInRange(
    sector: SectorEntity,
    minGradeIndex: number,
    maxGradeIndex: number,
  ): number {
    const distribution = sector.stats.gradeDistribution

    if (!distribution || typeof distribution !== 'object') {
      return 0
    }

    let count = 0
    for (const [gradeStr, routeCount] of Object.entries(distribution)) {
      const gradeIndex = Grade.calculateIndexFromString(gradeStr)
      if (
        gradeIndex !== null &&
        gradeIndex >= minGradeIndex &&
        gradeIndex <= maxGradeIndex
      ) {
        count += routeCount as number
      }
    }

    return count
  }

  /**
   * Generate human-readable match reasons
   */
  private generateMatchReasons(
    sector: SectorEntity,
    distance: number,
    routesInRange: number,
    context: ScoringContext,
  ): string[] {
    const reasons: string[] = []

    // Distance
    if (distance <= 20) {
      reasons.push(`Very close (${Math.round(distance)}km)`)
    } else if (distance <= 50) {
      reasons.push(`${Math.round(distance)}km away`)
    }

    // Routes in range
    if (routesInRange > 0) {
      reasons.push(`${routesInRange} routes in your grade range`)
    }

    // Orientation
    if (context.orientationPreference === 'shade') {
      const orientationStr = sector.orientation?.toString() ?? ''
      if (['N', 'NE', 'NW'].some((o) => orientationStr.includes(o))) {
        reasons.push('Good orientation (shade)')
      }
    } else if (context.orientationPreference === 'sun') {
      const orientationStr = sector.orientation?.toString() ?? ''
      if (['S', 'SE', 'SW'].some((o) => orientationStr.includes(o))) {
        reasons.push('Good orientation (sun)')
      }
    }

    // Popularity
    if ((sector.totalFavorites ?? 0) >= 50) {
      reasons.push(`Popular (${sector.totalFavorites} favorites)`)
    }

    // Quality
    if (sector.isTLC) {
      reasons.push('Featured area (TLC)')
    }
    if (sector.hasTopos() && sector.hasPhotos()) {
      reasons.push('Well documented (photos and topos)')
    }

    // Route count
    if (sector.stats.routeCount >= 50) {
      reasons.push(`Many routes (${sector.stats.routeCount})`)
    }

    return reasons
  }

  /**
   * Determine season from month
   */
  getSeason(month: number): SeasonType {
    if (month >= 6 && month <= 8) return 'summer' // Jun-Aug
    if (month >= 12 || month <= 2) return 'winter' // Dec-Feb
    if (month >= 3 && month <= 5) return 'spring' // Mar-May
    return 'autumn' // Sep-Nov
  }

  /**
   * Get preferred orientation based on season
   */
  getPreferredOrientation(season: SeasonType): OrientationPreference {
    if (season === 'summer') return 'shade'
    if (season === 'winter') return 'sun'
    return 'any'
  }
}
