import { Inject, Injectable, logger } from '@OneJs/core'
import { PrismaClientOneJs } from '@OneJs/prisma'
import { Crag } from '@crags/domain/entities/crag.entity'
import type { Prisma } from '@prisma/client'
import type { SearchCriteria } from '../../domain/value-objects/search-criteria.vo'
import { isExposureCompatible } from '../../domain/types/seasonality.types'
import type { BetaItem } from '@crags/domain/value-objects/beta.vo'
import type { StyleInfo } from '@crags/domain/value-objects/styles.vo'
import type { TagsMap } from '@crags/domain/value-objects/tags.vo'
import type { AltName } from '@crags/domain/value-objects/alt-names.vo'

/**
 * Repository for searching crags based on criteria
 * This is separate from CragPrismaRepository to avoid circular dependencies
 */
@Injectable()
export class SearchCragRepository {
  constructor(
    @Inject(PrismaClientOneJs) private readonly prisma: PrismaClientOneJs,
  ) {}

  /**
   * Find crags matching search criteria
   * Filters by: location (bounding box), grade range, quality, styles, and exposure
   * Note: Seasonality is NOT filtered - it affects scoring only
   */
  async findBySearchCriteria(criteria: SearchCriteria): Promise<Crag[]> {
    const coordinates = criteria.getCoordinates()
    const lat = coordinates.getLatitude()
    const lng = coordinates.getLongitude()

    if (lat === null || lng === null) {
      logger.warn('search:repository', 'Invalid coordinates', { coordinates })
      return []
    }

    const gradeRange = criteria.getGradeRange()
    const exposurePreference = criteria.getExposurePreference()
    const climbingStyles = criteria.getClimbingStyles()
    const minQualityRating = criteria.getMinQualityRating()

    // Calculate bounding box using domain logic
    const boundingBox = criteria.getBoundingBox()

    logger.debug('search:repository', `Bounding box: ${boundingBox.toString()}`)

    // Build where clause using bounding box
    // Note: Seasonality is NOT filtered here - it's used for scoring only
    // Crags with poor seasonality will have lower scores but won't be excluded
    const where = boundingBox.toPrismaWhere()

    logger.debug('search:repository', `Query where: ${JSON.stringify(where)}`)
    const data = await this.prisma.crag.findMany({ where })

    logger.debug('search:repository', `Raw query returned ${data.length} crags`)

    // Post-filter by grade range and new filters
    const crags = data
      .map((item) => this.mapToDomain(item))
      .filter((crag) => {
        const gbRoutes = crag.getGradeDistribution().getGbRoutes()

        // Must have routes in grade range
        if (!gradeRange.hasRoutesInRange(gbRoutes)) return false

        // Filter by quality rating if specified
        if (minQualityRating > 0) {
          const stats = crag.getStats()
          // Check if getOverallScore method exists (graceful fallback)
          if ('getOverallScore' in stats) {
            const overallScore = (
              stats as unknown as { getOverallScore: () => number }
            ).getOverallScore()
            if (overallScore < minQualityRating) {
              return false
            }
          }
          // If method doesn't exist, skip quality filtering for this crag
        }

        // Filter by climbing styles if specified
        if (climbingStyles.length > 0) {
          const stats = crag.getStats()
          // Check if getStyleDistribution method exists (graceful fallback)
          if ('getStyleDistribution' in stats) {
            const primaryStyle = (
              stats as unknown as {
                getStyleDistribution: () => { getPrimaryStyle: () => string }
              }
            )
              .getStyleDistribution()
              .getPrimaryStyle()
            if (!climbingStyles.includes(primaryStyle)) {
              return false
            }
          }
          // If method doesn't exist, skip style filtering for this crag
        }

        // Filter by exposure preference if specified
        if (exposurePreference !== 'any') {
          // Crags contain sectors - check if any sector matches exposure
          const hasMatchingExposure = this.checkCragExposure(
            crag,
            exposurePreference,
          )
          if (!hasMatchingExposure) {
            return false
          }
        }

        return true
      })

    return crags
  }

  /**
   * Check if crag has sectors matching exposure preference
   * For now, we use the crag's aggregated seasonality data
   * Future: may need to query sectors separately
   *
   * Uses centralized isExposureCompatible() for consistency with scoring logic.
   */
  private checkCragExposure(crag: Crag, preference: 'sun' | 'shade'): boolean {
    // Use centralized exposure matching logic
    // IMPORTANT: Use getGoodMonths() which returns month numbers (1-12),
    // NOT getMonths() which returns raw seasonality scores
    const goodMonths = crag.getSeasonality().getGoodMonths()
    return isExposureCompatible(goodMonths, preference)
  }

  private mapToDomain(data: Prisma.CragGetPayload<object>): Crag {
    return Crag.create({
      id: data.id,
      externalId: data.externalId,
      zoneId: data.zoneId,
      name: data.name,
      asciiName: data.asciiName ?? data.name,
      type: data.type,
      subType: data.subType,
      urlStub: data.urlStub ?? null,
      urlAncestorStub: data.urlAncestorStub ?? null,
      headerImage: data.headerImage ?? null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      areaSize: data.areaSize ?? null,
      geometry: data.geometry
        ? (data.geometry as Record<string, unknown>)
        : null,
      numberRoutes: data.numberRoutes ?? null,
      numberPhotos: data.numberPhotos ?? null,
      numberTopos: data.numberTopos ?? null,
      ascentCount: data.ascentCount ?? null,
      kudos: data.kudos ?? null,
      averageHeight: data.averageHeight ?? null,
      averageHeightUnit: data.averageHeightUnit ?? null,
      gbRoutes: data.gbRoutes ?? [],
      beta: data.beta ? (data.beta as unknown as BetaItem[]) : null,
      styles: data.styles ? (data.styles as unknown as StyleInfo[]) : null,
      tags: data.tags ? (data.tags as unknown as TagsMap) : null,
      altNames: data.altNames ? (data.altNames as unknown as AltName[]) : null,
      seasonality: data.seasonality ?? [],
      hasTopo: data.hasTopo,
      hasSectors: data.hasSectors,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    })
  }
}
