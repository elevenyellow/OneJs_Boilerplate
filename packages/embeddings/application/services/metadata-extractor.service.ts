import { CragEntity } from '@climb-zone/crag'
import { SectorEntity } from '@climb-zone/sector'
import { RouteEntity } from '@climb-zone/route'
import { ZoneMetadata, ZoneMetadataData } from '../../domain/value-objects/zone-metadata.vo'

/**
 * Metadata Extractor Service
 * Extracts structured metadata from climbing zones for hybrid search filtering
 */
export class MetadataExtractorService {
  /**
   * Extract comprehensive metadata from a crag and its routes
   */
  extract(
    crag: CragEntity,
    sectors: SectorEntity[],
    routes: RouteEntity[],
  ): ZoneMetadata {
    const gradeIndices = routes
      .map((r) => r.gradeIndex)
      .filter((g) => g !== null) as number[]

    const gradeDistribution = this.calculateGradeDistribution(routes)

    const data: ZoneMetadataData = {
      location: {
        lat: crag.latitude || 0,
        lon: crag.longitude || 0,
        locatedness: crag.locatedness?.toNumber(),
      },

      grades: {
        min: gradeIndices.length > 0 ? Math.min(...gradeIndices) : null,
        max: gradeIndices.length > 0 ? Math.max(...gradeIndices) : null,
        avg:
          gradeIndices.length > 0
            ? gradeIndices.reduce((a, b) => a + b, 0) / gradeIndices.length
            : null,
        distribution: gradeDistribution,
      },

      routeCount: routes.length,

      seasonality: {
        scores: this.normalizeSeasonality(crag.seasonality),
        bestMonths: crag.getBestMonths(),
      },

      approach: this.extractApproach(crag),

      characteristics: {
        orientations: this.extractOrientations(sectors),
        rockTypes: this.extractRockTypes(sectors),
        climbingStyles: this.extractClimbingStyles(sectors),
        sunExposure: this.calculateSunExposure(sectors),
        sheltered: this.calculateSheltered(sectors),
      },

      quality: {
        popularity: this.calculatePopularity(crag, routes),
        rating: this.calculateQuality(crag, routes),
      },

      facilities: {
        hasTopos: crag.hasTopos(),
        hasPhotos: crag.hasPhotos(),
        requiresPermit: crag.requiresPermit(),
        priceCategory: crag.priceCategory?.toString() || null,
      },

      routeTypes: {
        sport: routes.some((r) => r.isSport()),
        trad: routes.some(
          (r) => !r.isSport() && r.routeType?.toString() === 'trad',
        ),
        boulder: routes.some((r) => r.routeType?.toString() === 'boulder'),
        multiPitch: routes.some((r) => r.isMultiPitch()),
      },

      stats: {
        avgHeight: this.calculateAvgHeight(routes),
        totalAscents: routes.reduce(
          (sum, r) => sum + (r.ascents?.toNumber() || 0),
          0,
        ),
        numberPhotos: crag.numberPhotos,
        numberTopos: crag.numberTopos,
      },
    }

    return ZoneMetadata.create(data)
  }

  /**
   * Normalize seasonality scores to 0-1 range
   */
  private normalizeSeasonality(seasonality: any): number[] {
    const scores = seasonality.toArray()
    if (scores.length < 12) {
      return new Array(12).fill(0.5)
    }

    const validScores = scores.slice(0, 12)
    const max = Math.max(...validScores, 1)
    return validScores.map((s: number) => Math.max(0, Math.min(1, s / max)))
  }

  /**
   * Extract approach information from crag description
   */
  private extractApproach(crag: CragEntity): {
    timeMin: number | null
    difficulty: 'easy' | 'moderate' | 'difficult' | null
  } {
    const approachText = crag.approach?.toLowerCase() || ''

    let timeMin: number | null = null
    let difficulty: 'easy' | 'moderate' | 'difficult' | null = null

    // Try to extract time in minutes
    const timeMatch = approachText.match(/(\d+)\s*(min|minutes?|minutos?)/i)
    if (timeMatch) {
      timeMin = parseInt(timeMatch[1])
    } else if (
      approachText.includes('quick') ||
      approachText.includes('short') ||
      approachText.includes('rápid') ||
      approachText.includes('corto')
    ) {
      timeMin = 5
    } else if (
      approachText.includes('long') ||
      approachText.includes('far') ||
      approachText.includes('largo') ||
      approachText.includes('lejos')
    ) {
      timeMin = 30
    }

    // Try to extract difficulty
    if (
      approachText.includes('easy') ||
      approachText.includes('simple') ||
      approachText.includes('fácil') ||
      approachText.includes('sencill')
    ) {
      difficulty = 'easy'
    } else if (
      approachText.includes('technical') ||
      approachText.includes('difficult') ||
      approachText.includes('steep') ||
      approachText.includes('técnic') ||
      approachText.includes('difícil') ||
      approachText.includes('escarpado')
    ) {
      difficulty = 'difficult'
    } else if (approachText.includes('moderate') || approachText.includes('moderad')) {
      difficulty = 'moderate'
    }

    return { timeMin, difficulty }
  }

  /**
   * Extract unique orientations from sectors
   */
  private extractOrientations(sectors: SectorEntity[]): string[] {
    return [
      ...new Set(
        sectors
          .map((s) => s.orientation?.toString())
          .filter(Boolean) as string[],
      ),
    ]
  }

  /**
   * Extract unique rock types from sectors
   */
  private extractRockTypes(sectors: SectorEntity[]): string[] {
    return [
      ...new Set(
        sectors.map((s) => s.rockType?.toString()).filter(Boolean) as string[],
      ),
    ]
  }

  /**
   * Extract climbing styles from all sectors
   */
  private extractClimbingStyles(sectors: SectorEntity[]): string[] {
    return [...new Set(sectors.flatMap((s) => s.climbingStyle.toArray()))]
  }

  /**
   * Calculate overall sun exposure based on sectors
   */
  private calculateSunExposure(sectors: SectorEntity[]): string | null {
    if (sectors.length === 0) return null

    const shadedCount = sectors.filter((s) => s.isShaded()).length
    const ratio = shadedCount / sectors.length

    if (ratio > 0.7) return 'full_shade'
    if (ratio > 0.3) return 'partial_shade'
    return 'full_sun'
  }

  /**
   * Calculate if zone is generally sheltered
   */
  private calculateSheltered(sectors: SectorEntity[]): boolean | null {
    if (sectors.length === 0) return null

    const shelteredCount = sectors.filter((s) => s.sheltered === true).length
    return shelteredCount > sectors.length / 2
  }

  /**
   * Calculate normalized popularity score (0-1)
   */
  private calculatePopularity(
    crag: CragEntity,
    routes: RouteEntity[],
  ): number {
    let score = 0

    // Favorites (40% weight)
    const favorites = crag.totalFavorites || 0
    score += Math.min(favorites / 100, 1) * 0.4

    // Ascents (30% weight)
    const totalAscents = routes.reduce(
      (sum, r) => sum + (r.ascents?.toNumber() || 0),
      0,
    )
    score += Math.min(totalAscents / 1000, 1) * 0.3

    // Max pop (20% weight)
    const maxPop = crag.maxPop || 0
    score += Math.min(maxPop / 100, 1) * 0.2

    // Photos (10% weight)
    const photos = crag.numberPhotos || 0
    score += Math.min(photos / 50, 1) * 0.1

    return Math.min(score, 1)
  }

  /**
   * Calculate normalized quality score (0-1)
   */
  private calculateQuality(crag: CragEntity, routes: RouteEntity[]): number {
    let score = 0

    // Kudos (50% weight)
    const kudos = crag.kudos?.toNumber() || 0
    score += Math.min(kudos / 100, 1) * 0.5

    // Classic routes (30% weight)
    const classicRoutes = routes.filter((r) => r.isClassic()).length
    if (routes.length > 0) {
      score += Math.min(classicRoutes / routes.length, 1) * 0.3
    }

    // Average route quality (20% weight)
    const routesWithQuality = routes.filter((r) => r.quality !== null)
    if (routesWithQuality.length > 0) {
      const avgQuality =
        routesWithQuality.reduce(
          (sum, r) => sum + (r.quality?.toNumber() || 0),
          0,
        ) / routesWithQuality.length
      score += (avgQuality / 100) * 0.2
    }

    return Math.min(score, 1)
  }

  /**
   * Calculate grade distribution
   */
  private calculateGradeDistribution(
    routes: RouteEntity[],
  ): Record<string, number> {
    const dist: Record<string, number> = {}

    for (const route of routes) {
      const grade = route.gradeString
      if (grade) {
        dist[grade] = (dist[grade] || 0) + 1
      }
    }

    return dist
  }

  /**
   * Calculate average route height
   */
  private calculateAvgHeight(routes: RouteEntity[]): number | null {
    const heights = routes
      .map((r) => r.height?.toNumber())
      .filter((h) => h !== null) as number[]

    if (heights.length === 0) return null

    return heights.reduce((sum, h) => sum + h, 0) / heights.length
  }
}
