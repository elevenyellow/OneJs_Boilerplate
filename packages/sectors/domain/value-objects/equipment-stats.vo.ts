/**
 * Input for equipment stats creation
 */
export interface EquipmentStatsInput {
  totalRoutes: number
  averageBolts?: number
  maxBolts?: number
  routesWithTopoCount?: number
  wellEquippedRoutesCount?: number
}

/**
 * Serialized equipment stats
 */
export interface EquipmentStatsPrimitives {
  totalRoutes: number
  averageBolts: number
  maxBolts: number
  routesWithTopoCount: number
  routesWithTopoPercentage: number
  wellEquippedRoutesCount: number
  wellEquippedPercentage: number
  isWellDocumented: boolean
  isWellEquipped: boolean
}

/**
 * Thresholds for equipment classification
 */
const EQUIPMENT_THRESHOLDS = {
  WELL_DOCUMENTED_PERCENTAGE: 70, // >70% with topos = well documented
  WELL_EQUIPPED_PERCENTAGE: 70, // >70% well equipped
  MINIMUM_GOOD_BOLTS: 6, // At least 6 bolts average for sport routes
} as const

/**
 * Value object representing equipment and documentation statistics for a sector.
 * Tracks bolt counts, topo coverage, and equipment quality.
 */
export class EquipmentStats {
  private readonly totalRoutes: number
  private readonly averageBolts: number
  private readonly maxBolts: number
  private readonly routesWithTopoCount: number
  private readonly wellEquippedRoutesCount: number

  private constructor(
    totalRoutes: number,
    averageBolts: number,
    maxBolts: number,
    routesWithTopoCount: number,
    wellEquippedRoutesCount: number,
  ) {
    this.totalRoutes = totalRoutes
    this.averageBolts = averageBolts
    this.maxBolts = maxBolts
    this.routesWithTopoCount = routesWithTopoCount
    this.wellEquippedRoutesCount = wellEquippedRoutesCount
  }

  /**
   * Creates equipment stats from input data
   */
  static createFrom(
    data: EquipmentStatsInput | null | undefined,
  ): EquipmentStats {
    if (!data) {
      return EquipmentStats.createEmpty()
    }

    return new EquipmentStats(
      data.totalRoutes,
      data.averageBolts ?? 0,
      data.maxBolts ?? 0,
      data.routesWithTopoCount ?? 0,
      data.wellEquippedRoutesCount ?? 0,
    )
  }

  /**
   * Creates empty equipment stats
   */
  static createEmpty(): EquipmentStats {
    return new EquipmentStats(0, 0, 0, 0, 0)
  }

  // ============================================================================
  // BASIC METRICS
  // ============================================================================

  getTotalRoutes(): number {
    return this.totalRoutes
  }

  isEmpty(): boolean {
    return this.totalRoutes === 0
  }

  // ============================================================================
  // BOLT METRICS
  // ============================================================================

  getAverageBolts(): number {
    return this.averageBolts
  }

  getMaxBolts(): number {
    return this.maxBolts
  }

  // ============================================================================
  // TOPO COVERAGE
  // ============================================================================

  getRoutesWithTopoCount(): number {
    return this.routesWithTopoCount
  }

  getRoutesWithTopoPercentage(): number {
    if (this.totalRoutes === 0) return 0
    return Math.round((this.routesWithTopoCount / this.totalRoutes) * 100)
  }

  /**
   * Check if sector is well documented (>70% routes have topos)
   */
  isWellDocumented(): boolean {
    return (
      this.getRoutesWithTopoPercentage() >=
      EQUIPMENT_THRESHOLDS.WELL_DOCUMENTED_PERCENTAGE
    )
  }

  // ============================================================================
  // EQUIPMENT QUALITY
  // ============================================================================

  getWellEquippedRoutesCount(): number {
    return this.wellEquippedRoutesCount
  }

  getWellEquippedPercentage(): number {
    if (this.totalRoutes === 0) return 0
    return Math.round((this.wellEquippedRoutesCount / this.totalRoutes) * 100)
  }

  /**
   * Check if sector is well equipped
   */
  isWellEquipped(): boolean {
    return (
      this.getWellEquippedPercentage() >=
        EQUIPMENT_THRESHOLDS.WELL_EQUIPPED_PERCENTAGE ||
      this.averageBolts >= EQUIPMENT_THRESHOLDS.MINIMUM_GOOD_BOLTS
    )
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  toPrimitives(): EquipmentStatsPrimitives {
    return {
      totalRoutes: this.totalRoutes,
      averageBolts: this.averageBolts,
      maxBolts: this.maxBolts,
      routesWithTopoCount: this.routesWithTopoCount,
      routesWithTopoPercentage: this.getRoutesWithTopoPercentage(),
      wellEquippedRoutesCount: this.wellEquippedRoutesCount,
      wellEquippedPercentage: this.getWellEquippedPercentage(),
      isWellDocumented: this.isWellDocumented(),
      isWellEquipped: this.isWellEquipped(),
    }
  }

  // ============================================================================
  // EQUALITY
  // ============================================================================

  equals(other: EquipmentStats): boolean {
    return (
      this.totalRoutes === other.totalRoutes &&
      this.averageBolts === other.averageBolts &&
      this.maxBolts === other.maxBolts &&
      this.routesWithTopoCount === other.routesWithTopoCount
    )
  }

  toString(): string {
    return `EquipmentStats(avgBolts=${this.averageBolts}, topoCoverage=${this.getRoutesWithTopoPercentage()}%)`
  }
}
