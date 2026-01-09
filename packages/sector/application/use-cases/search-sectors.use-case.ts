import { Inject, Injectable } from '@OneJs/core'
import { Coordinates, Grade } from '@climb-zone/shared'
import type {
  SearchSectorsDto,
  SearchSectorsResponse,
  AdvancedSearchFilters,
} from '@sector/domain/dtos/search-sectors.dto'
import { SectorPrismaRepository } from '@sector/infrastructure/persistence/prisma/sector.repository'
import {
  SectorScoringService,
  type SeasonType,
  type OrientationPreference,
} from '@sector/application/services/sector-scoring.service'

/**
 * Use Case: Search sectors with intelligent filtering and scoring
 *
 * Features:
 * - Distance-based filtering with user location
 * - Automatic orientation preference based on season
 * - Grade range matching with route distribution analysis
 * - Multi-factor relevance scoring
 */
@Injectable()
export class SearchSectorsUseCase {
  constructor(
    @Inject(SectorPrismaRepository)
    private readonly sectorRepository: SectorPrismaRepository,
    @Inject(SectorScoringService)
    private readonly scoringService: SectorScoringService,
  ) {}

  async execute(dto: SearchSectorsDto): Promise<SearchSectorsResponse> {
    const startTime = Date.now()

    // 1. Prepare search parameters
    const userLocation = new Coordinates(dto.userLocation.lat, dto.userLocation.lon)
    const maxDistance = dto.maxDistance ?? 100 // default 100km
    const currentMonth = dto.currentMonth ?? new Date().getMonth() + 1
    const limit = dto.limit ?? 20
    const offset = dto.offset ?? 0

    // 2. Calculate grade indices
    const minGradeIndex = Grade.calculateIndexFromString(dto.gradeRange.min)
    const maxGradeIndex = Grade.calculateIndexFromString(dto.gradeRange.max)

    if (minGradeIndex === null || maxGradeIndex === null) {
      throw new Error(`Invalid grade range: ${dto.gradeRange.min} - ${dto.gradeRange.max}`)
    }

    // 3. Determine season and orientation preference
    const season = this.scoringService.getSeason(currentMonth)
    const orientationPreference =
      dto.forceOrientation ?? this.scoringService.getPreferredOrientation(season)

    // 4. Calculate geographic bounds (bounding box)
    const { latMin, latMax, lonMin, lonMax } = this.calculateGeographicBounds(
      userLocation,
      maxDistance,
    )

    // 5. Build advanced filters
    const advancedFilters: AdvancedSearchFilters = {
      latitudeMin: latMin,
      latitudeMax: latMax,
      longitudeMin: lonMin,
      longitudeMax: lonMax,
      minGradeIndex,
      maxGradeIndex,
      minRoutes: dto.minRoutes,
      rockTypes: dto.rockTypes,
      climbingStyles: dto.climbingStyles,
      hasTopo: dto.hasTopo,
      requiresNoPermit: dto.requiresNoPermit,
      limit: limit * 3, // Fetch more candidates for scoring
      offset: 0, // We'll handle pagination after scoring
    }

    // 6. Fetch candidate sectors from database
    const candidates = await this.sectorRepository.searchWithAdvancedFilters(
      advancedFilters,
    )

    // 7. Score all candidates
    const scoredResults = candidates.map((sector) => {
      return this.scoringService.scoreSector(sector, {
        userLocation,
        minGradeIndex,
        maxGradeIndex,
        currentMonth,
        orientationPreference,
      })
    })

    // 8. Sort by relevance score (descending)
    scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore)

    // 9. Apply pagination after scoring
    const paginatedResults = scoredResults.slice(offset, offset + limit)

    // 10. Calculate search time
    const searchTime = Date.now() - startTime

    return {
      results: paginatedResults,
      total: scoredResults.length,
      filters: dto,
      metadata: {
        searchTime,
        detectedSeason: season,
        preferredOrientation: orientationPreference,
      },
    }
  }

  /**
   * Calculate geographic bounding box for initial filtering
   * Uses approximation: 1 degree latitude ≈ 111km, longitude varies by latitude
   */
  private calculateGeographicBounds(
    center: Coordinates,
    radiusKm: number,
  ): { latMin: number; latMax: number; lonMin: number; lonMax: number } {
    const latDelta = radiusKm / 111
    const lonDelta = radiusKm / (111 * Math.cos((center.latitude * Math.PI) / 180))

    return {
      latMin: center.latitude - latDelta,
      latMax: center.latitude + latDelta,
      lonMin: center.longitude - lonDelta,
      lonMax: center.longitude + lonDelta,
    }
  }
}
