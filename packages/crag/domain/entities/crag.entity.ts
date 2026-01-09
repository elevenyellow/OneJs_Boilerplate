import { CountryId } from '@climb-zone/country'
import { RegionId } from '@climb-zone/region'
import {
  BetaInfo,
  ExternalId,
  Geometry,
  Name,
  Seasonality,
  Url,
  AltNames,
  Locatedness,
  PermitInfo,
} from '@climb-zone/shared'
import { CragId } from '../value-objects/crag-id.vo'
import { PriceCategory } from '@sector/domain/value-objects/price-category.vo'
import { Kudos } from '@sector/domain/value-objects/kudos.vo'

/**
 * Crag Entity - Represents a climbing area at the highest level
 * Examples: Chulilla, Siurana, Rodellar
 *
 * A Crag always belongs to a Country (required).
 * Optionally belongs to a Region (e.g., Comunidad Valenciana).
 * All fields use Value Objects for validation.
 */
export class CragEntity {
  constructor(
    public readonly id: CragId,
    public readonly externalId: ExternalId,
    public readonly countryId: CountryId,
    public readonly regionId: RegionId | null,
    public readonly name: Name,
    public readonly altNames: AltNames,
    public readonly geometry: Geometry | null,
    public readonly locatedness: Locatedness | null,
    public readonly seasonality: Seasonality,
    public readonly beta: BetaInfo,
    public readonly numberPhotos: number | null,
    public readonly numberTopos: number | null,
    public readonly hasTopo: boolean,
    public readonly totalFavorites: number | null,
    public readonly kudos: Kudos | null,
    public readonly ascentCount: number | null,
    public readonly maxPop: number | null,
    public readonly priceCategory: PriceCategory | null,
    public readonly permitNode: PermitInfo,
    public readonly tagsRaw: Record<string, unknown> | null,
    public readonly sourceUrl: Url,
    public readonly urlStub: string | null,
    public readonly urlAncestorStub: string | null,
    public readonly lastPDFSize: string | null,
    public readonly lastPDFStaticDate: string | null,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  get latitude(): number | null {
    return this.geometry?.lat ?? null
  }

  get longitude(): number | null {
    return this.geometry?.long ?? null
  }

  get description(): string | null {
    return this.beta.getDescription()
  }

  get approach(): string | null {
    return this.beta.getApproach()
  }

  get ethic(): string | null {
    return this.beta.getEthic()
  }

  getBestMonths(): number[] {
    return this.seasonality.getBestMonths()
  }

  isGoodMonth(month: number): boolean {
    return this.seasonality.isGoodMonth(month)
  }

  hasPhotos(): boolean {
    return this.numberPhotos !== null && this.numberPhotos > 0
  }

  hasTopos(): boolean {
    return this.numberTopos !== null && this.numberTopos > 0
  }

  isPopular(): boolean {
    return this.totalFavorites !== null && this.totalFavorites >= 50
  }

  hasAccurateLocation(): boolean {
    return this.locatedness?.isReasonablyAccurate() ?? false
  }

  requiresPermit(): boolean {
    return this.permitNode.hasPermitRequired()
  }

  getTheCragUrl(): string | null {
    if (!this.urlStub) return null
    return `https://www.thecrag.com${this.urlStub}`
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id.toString(),
      externalId: this.externalId.toNumber(),
      countryId: this.countryId.toString(),
      regionId: this.regionId?.toString() ?? null,
      name: this.name.toString(),
      altNames: this.altNames.toArray(),
      latitude: this.latitude,
      longitude: this.longitude,
      geometry: this.geometry?.toJSON(),
      locatedness: this.locatedness?.toNumber() ?? null,
      seasonality: this.seasonality.toArray(),
      description: this.description,
      approach: this.approach,
      ethic: this.ethic,
      numberPhotos: this.numberPhotos,
      numberTopos: this.numberTopos,
      hasTopo: this.hasTopo,
      totalFavorites: this.totalFavorites,
      kudos: this.kudos?.toNumber() ?? null,
      ascentCount: this.ascentCount,
      maxPop: this.maxPop,
      priceCategory: this.priceCategory?.toString() ?? null,
      permitNode: this.permitNode.toJSON(),
      tagsRaw: this.tagsRaw,
      sourceUrl: this.sourceUrl.toString(),
      urlStub: this.urlStub,
      urlAncestorStub: this.urlAncestorStub,
      lastPDFSize: this.lastPDFSize,
      lastPDFStaticDate: this.lastPDFStaticDate,
      theCragUrl: this.getTheCragUrl(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
