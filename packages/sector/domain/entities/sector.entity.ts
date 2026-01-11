import { AreaId } from '@area/domain/value-objects/area-id.vo'
import {
  AltNames,
  BetaInfo,
  Coordinates,
  ExternalId,
  Geometry,
  Locatedness,
  Name,
  PermitInfo,
  Seasonality,
} from '@climb-zone/shared'
import { ClimbingStyle } from '../value-objects/climbing-style.vo'
import { Kudos } from '../value-objects/kudos.vo'
import { Orientation } from '../value-objects/orientation.vo'
import { PriceCategory } from '../value-objects/price-category.vo'
import { RockType } from '../value-objects/rock-type.vo'
import { SectorId } from '../value-objects/sector-id.vo'
import { SectorStats } from '../value-objects/sector-stats.vo'
import { SectorTags } from '../value-objects/sector-tags.vo'
import { SunExposure } from '../value-objects/sun-exposure.vo'

export type SectorType = 'Sector' | 'Cliff'

/**
 * Sector Entity - Represents a specific climbing area with routes
 * Examples: "Muro de las Lamentaciones", "Diedros"
 */
export class SectorEntity {
  constructor(
    public readonly id: SectorId,
    public readonly externalId: ExternalId,
    public readonly areaId: AreaId,
    public readonly name: Name,
    public readonly altNames: AltNames,
    public readonly type: SectorType,
    public readonly geometry: Geometry | null,
    public readonly locatedness: Locatedness | null,
    public readonly orientation: Orientation | null,
    public readonly rockType: RockType | null,
    public readonly climbingStyle: ClimbingStyle,
    public readonly sunExposure: SunExposure | null,
    public readonly sheltered: boolean | null,
    public readonly seasonality: Seasonality,
    public readonly beta: BetaInfo,
    public readonly stats: SectorStats,
    public readonly numberPhotos: number | null,
    public readonly numberTopos: number | null,
    public readonly totalFavorites: number | null,
    public readonly isTLC: boolean,
    public readonly ascentCount: number | null,
    public readonly maxPop: number | null,
    public readonly priceCategory: PriceCategory | null,
    public readonly hasTopo: boolean,
    public readonly kudos: Kudos | null,
    public readonly permitNode: PermitInfo,
    public readonly siblingLabel: string | null,
    public readonly tagsRaw: Record<string, unknown> | null,
    // Tags procesados (extraídos de tagsRaw para búsquedas eficientes)
    public readonly kidFriendly: boolean | null,
    public readonly beginner: boolean | null,
    public readonly dogFriendly: boolean | null,
    public readonly accessible: boolean | null,
    public readonly camping: boolean | null,
    public readonly swimming: boolean | null,
    public readonly scenic: boolean | null,
    public readonly popular: boolean | null,
    public readonly quiet: boolean | null,
    public readonly multipitch: boolean | null,
    public readonly trad: boolean | null,
    public readonly sport: boolean | null,
    public readonly bouldering: boolean | null,
    public readonly urlStub: string | null,
    public readonly urlAncestorStub: string | null,
    public readonly lastPDFSize: string | null,
    public readonly lastPDFStaticDate: string | null,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    // Header image
    public readonly headerImageUrl: string | null = null,
    public readonly headerImageWidth: number | null = null,
    public readonly headerImageHeight: number | null = null,
  ) {}

  get latitude(): number | null {
    return this.geometry?.lat ?? null
  }

  get longitude(): number | null {
    return this.geometry?.long ?? null
  }

  getCoordinates(): Coordinates | null {
    if (this.latitude === null || this.longitude === null) return null
    return new Coordinates(this.latitude, this.longitude)
  }

  distanceTo(coords: Coordinates): number | null {
    const myCoords = this.getCoordinates()
    if (!myCoords) return null
    return myCoords.distanceTo(coords)
  }

  getBestMonths(): number[] {
    return this.seasonality.getBestMonths()
  }

  isGoodMonth(month: number): boolean {
    return this.seasonality.isGoodMonth(month)
  }

  getDescription(): string | null {
    return this.beta.getDescription()
  }

  getApproach(): string | null {
    return this.beta.getApproach()
  }

  hasOrientation(): boolean {
    return this.orientation !== null
  }

  isGoodForSummer(): boolean {
    return this.orientation?.isGoodForSummer() ?? false
  }

  isGoodForWinter(): boolean {
    return this.orientation?.isGoodForWinter() ?? false
  }

  hasOverhangs(): boolean {
    return this.climbingStyle.hasOverhangs()
  }

  isShaded(): boolean {
    return this.sunExposure?.isShaded() ?? false
  }

  hasPhotos(): boolean {
    return this.numberPhotos !== null && this.numberPhotos > 0
  }

  hasTopos(): boolean {
    return this.numberTopos !== null && this.numberTopos > 0
  }

  isPopular(): boolean {
    return this.totalFavorites !== null && this.totalFavorites >= 10
  }

  hasAccurateLocation(): boolean {
    return this.locatedness?.isReasonablyAccurate() ?? false
  }

  requiresPermit(): boolean {
    return this.permitNode.hasPermitRequired()
  }

  /**
   * Get processed tags from raw tags
   * Lazily computed from tagsRaw (for backward compatibility)
   */
  getTags(): SectorTags {
    return SectorTags.create(this.tagsRaw)
  }

  /**
   * Check if sector is kid friendly (uses stored field, not lazy computed)
   */
  isKidFriendly(): boolean {
    return this.kidFriendly === true
  }

  /**
   * Check if sector is explicitly NOT kid friendly
   */
  isNotKidFriendly(): boolean {
    return this.kidFriendly === false
  }

  /**
   * Check if sector is good for beginners
   */
  isBeginner(): boolean {
    return this.beginner === true
  }

  /**
   * Check if sector is good for families (kid friendly, accessible, or beginner)
   */
  isGoodForFamilies(): boolean {
    return this.kidFriendly === true || this.beginner === true || this.accessible === true
  }

  getTheCragUrl(): string | null {
    if (!this.urlStub) return null
    return `https://www.thecrag.com${this.urlStub}`
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id.toString(),
      externalId: this.externalId.toNumber(),
      areaId: this.areaId.toString(),
      name: this.name.toString(),
      altNames: this.altNames.toArray(),
      type: this.type,
      latitude: this.latitude,
      longitude: this.longitude,
      geometry: this.geometry?.toJSON(),
      locatedness: this.locatedness?.toNumber() ?? null,
      orientation: this.orientation?.toString() ?? null,
      rockType: this.rockType?.toString() ?? null,
      climbingStyle: this.climbingStyle.toArray(),
      sunExposure: this.sunExposure?.toString() ?? null,
      sheltered: this.sheltered,
      seasonality: this.seasonality.toArray(),
      beta: this.beta.toJSON(),
      stats: this.stats.toJSON(),
      numberPhotos: this.numberPhotos,
      numberTopos: this.numberTopos,
      totalFavorites: this.totalFavorites,
      isTLC: this.isTLC,
      ascentCount: this.ascentCount,
      maxPop: this.maxPop,
      priceCategory: this.priceCategory?.toString() ?? null,
      hasTopo: this.hasTopo,
      kudos: this.kudos?.toNumber() ?? null,
      permitNode: this.permitNode.toJSON(),
      siblingLabel: this.siblingLabel,
      tagsRaw: this.tagsRaw,
      // Tags procesados (campos directos)
      kidFriendly: this.kidFriendly,
      beginner: this.beginner,
      dogFriendly: this.dogFriendly,
      accessible: this.accessible,
      camping: this.camping,
      swimming: this.swimming,
      scenic: this.scenic,
      popular: this.popular,
      quiet: this.quiet,
      multipitch: this.multipitch,
      trad: this.trad,
      sport: this.sport,
      bouldering: this.bouldering,
      urlStub: this.urlStub,
      urlAncestorStub: this.urlAncestorStub,
      lastPDFSize: this.lastPDFSize,
      lastPDFStaticDate: this.lastPDFStaticDate,
      theCragUrl: this.getTheCragUrl(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      headerImageUrl: this.headerImageUrl,
      headerImageWidth: this.headerImageWidth,
      headerImageHeight: this.headerImageHeight,
    }
  }

  hasHeaderImage(): boolean {
    return this.headerImageUrl !== null
  }

  /**
   * Update sector stats (returns a new instance since entity is immutable)
   * Note: This mutates the internal stats for compatibility with existing code
   */
  updateStats(newStats: SectorStats): void {
    // @ts-ignore - Mutating readonly for compatibility
    (this as any).stats = newStats
  }

  /**
   * Create a new sector instance with updated stats
   */
  withStats(newStats: SectorStats): SectorEntity {
    return new SectorEntity(
      this.id,
      this.externalId,
      this.areaId,
      this.name,
      this.altNames,
      this.type,
      this.geometry,
      this.locatedness,
      this.orientation,
      this.rockType,
      this.climbingStyle,
      this.sunExposure,
      this.sheltered,
      this.seasonality,
      this.beta,
      newStats,
      this.numberPhotos,
      this.numberTopos,
      this.totalFavorites,
      this.isTLC,
      this.ascentCount,
      this.maxPop,
      this.priceCategory,
      this.hasTopo,
      this.kudos,
      this.permitNode,
      this.siblingLabel,
      this.tagsRaw,
      this.kidFriendly,
      this.beginner,
      this.dogFriendly,
      this.accessible,
      this.camping,
      this.swimming,
      this.scenic,
      this.popular,
      this.quiet,
      this.multipitch,
      this.trad,
      this.sport,
      this.bouldering,
      this.urlStub,
      this.urlAncestorStub,
      this.lastPDFSize,
      this.lastPDFStaticDate,
      this.createdAt,
      this.updatedAt,
      this.headerImageUrl,
      this.headerImageWidth,
      this.headerImageHeight,
    )
  }
}
