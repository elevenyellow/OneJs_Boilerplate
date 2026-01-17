import { getGradeCategory } from '@grades/domain/services/grade-category'
import type { Route } from '../../domain/entities/route.entity'
import type { RouteListItemDto, RouteResponseDto } from '../../domain/dtos'
import { Bolts, StyleFlags } from '../../domain/value-objects'

const EQUIPMENT_OLD_AGE_THRESHOLD_YEARS = 15
const MAINTENANCE_RECENT_THRESHOLD_YEARS = 3

/**
 * Maps Route entities to response DTOs
 * Grade is sent as gradeBand (numeric index) - client converts to display string
 */
export class RouteToResponseMapper {
  /**
   * Convert a Route entity to a full response DTO
   *
   * @param route - Route entity to convert
   * @returns RouteResponseDto with gradeBand for client-side conversion
   */
  static toResponseDto(route: Route): RouteResponseDto {
    const primitives = route.toPrimitives()
    const gradeBand = primitives.gradeBand
    const gradeCategory = getGradeCategory(gradeBand)

    return {
      id: primitives.id,
      externalId: String(primitives.externalId),
      name: primitives.name,

      // Grade information - gradeBand sent for client conversion
      grade: primitives.grade ?? null,
      gradeBand: gradeBand,
      gradeCategory: gradeCategory,
      gradeStyle: primitives.gradeStyle ?? null,

      // Dimensions
      height: primitives.height ?? null,
      heightUnit: primitives.heightUnit ?? null,
      pitches: primitives.pitches ?? null,

      // Quality
      stars: primitives.stars ?? null,

      // Popularity
      ascents: primitives.ascents ?? null,

      // Style & Equipment
      style: primitives.style ?? null,
      bolts: primitives.bolts ?? null,

      // Style (decoded from bitmask)
      styleFlags: primitives.styleFlags ?? 0,
      primaryStyle: StyleFlags.createFrom(
        primitives.styleFlags,
      ).getPrimaryStyle(),

      // Status
      isClosed: primitives.isClosed ?? false,
      hasWarning: primitives.hasWarning ?? false,
      warningText: primitives.warningText ?? null,

      // Topo
      hasTopo: primitives.hasTopo ?? false,
      topoNumber: primitives.topoNumber ?? null,

      // Hierarchy
      siblingLabel: primitives.siblingLabel ?? null,
      sectorId: primitives.sectorId ?? null,
      cragId: primitives.cragId,
    }
  }

  /**
   * Convert a Route entity to a comprehensive list item DTO
   * Contains all relevant data for climbers in the sector route list
   * Grade is sent as gradeBand - client converts to display string
   *
   * @param route - Route entity to convert
   * @returns RouteListItemDto with gradeBand for client-side conversion
   */
  static toListItemDto(route: Route): RouteListItemDto {
    const primitives = route.toPrimitives()
    const gradeBand = primitives.gradeBand
    const gradeCategory = getGradeCategory(gradeBand)

    const styleFlags = StyleFlags.createFrom(primitives.styleFlags)
    const bolts = Bolts.createFrom(primitives.bolts)
    const heightMeters = primitives.height

    const equipmentAgeYears = RouteToResponseMapper.calculateEquipmentAge(
      primitives.equipDate ?? null,
    )
    const maintenanceYear = RouteToResponseMapper.extractYear(
      primitives.maintDate ?? null,
    )
    const currentYear = new Date().getFullYear()
    const wasRecentlyMaintained =
      maintenanceYear !== null &&
      currentYear - maintenanceYear <= MAINTENANCE_RECENT_THRESHOLD_YEARS

    const needsMaintenanceReview =
      equipmentAgeYears !== null &&
      equipmentAgeYears > EQUIPMENT_OLD_AGE_THRESHOLD_YEARS &&
      !wasRecentlyMaintained

    return {
      id: primitives.id,
      externalId: String(primitives.externalId),
      name: primitives.name,
      akaNames: primitives.akaNames ?? [],

      // Grade - gradeBand sent for client conversion
      gradeBand: gradeBand,
      gradeCategory: gradeCategory,
      gradeStyle: primitives.gradeStyle ?? null,

      // Dimensions
      height: primitives.height ?? null,
      heightUnit: primitives.heightUnit ?? 'm',
      heightDisplay: RouteToResponseMapper.formatHeight(
        primitives.height ?? null,
        primitives.heightUnit ?? null,
      ),
      pitches: primitives.pitches ?? null,
      isMultiPitch:
        primitives.pitches !== null &&
        primitives.pitches !== undefined &&
        primitives.pitches > 1,

      // Equipment & Protection
      bolts: primitives.bolts ?? null,
      protectionRating: bolts.getProtectionRating(heightMeters ?? null),
      boltSpacing: bolts.getBoltSpacing(heightMeters ?? null),

      // Style
      style: primitives.style ?? null,
      styleFlags: primitives.styleFlags ?? 0,
      primaryStyle: styleFlags.getPrimaryStyle(),
      activeStyles: styleFlags.getActiveStyles(),

      // Quality
      stars: primitives.stars ?? null,
      isClassic:
        primitives.stars !== null &&
        primitives.stars !== undefined &&
        primitives.stars >= 3,

      // History
      firstAscent: primitives.firstAscent ?? null,
      equipper: primitives.equipper ?? null,
      equipDate: primitives.equipDate ?? null,
      maintainer: primitives.maintainer ?? null,
      maintDate: primitives.maintDate ?? null,
      equipmentAgeYears: equipmentAgeYears,
      needsMaintenanceReview: needsMaintenanceReview,

      // Status
      isClosed: primitives.isClosed ?? false,
      hasWarning: primitives.hasWarning ?? false,
      warningText: primitives.warningText ?? null,

      // Beta
      description: primitives.description ?? null,

      // Topo
      hasTopo: primitives.hasTopo ?? false,
      topoNumber: primitives.topoNumber ?? null,
      siblingLabel: primitives.siblingLabel ?? null,

      // Hierarchy
      sectorId: primitives.sectorId ?? null,
      cragId: primitives.cragId,
    }
  }

  /**
   * Convert multiple routes to list item DTOs
   *
   * @param routes - Array of Route entities
   * @returns Array of RouteListItemDto with gradeBand for client-side conversion
   */
  static toListItemDtos(routes: Route[]): RouteListItemDto[] {
    return routes.map((route) => RouteToResponseMapper.toListItemDto(route))
  }

  /**
   * Format height with unit for display
   */
  private static formatHeight(
    height: number | null,
    unit: string | null,
  ): string | null {
    if (height === null) return null
    return `${height}${unit || 'm'}`
  }

  /**
   * Calculate equipment age in years from equip date string
   */
  private static calculateEquipmentAge(
    equipDate: string | null,
  ): number | null {
    const year = RouteToResponseMapper.extractYear(equipDate)
    if (year === null) return null

    const currentYear = new Date().getFullYear()
    return currentYear - year
  }

  /**
   * Extract year from a date string (e.g., "2015", "2015-06", "June 2015")
   */
  private static extractYear(dateString: string | null): number | null {
    if (!dateString) return null

    const yearMatch = dateString.match(/\b(19|20)\d{2}\b/)
    if (yearMatch) {
      return Number.parseInt(yearMatch[0], 10)
    }
    return null
  }
}
