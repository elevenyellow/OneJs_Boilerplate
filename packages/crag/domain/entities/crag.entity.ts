import { CountryId } from '@climb-zone/country'
import { RegionId } from '@climb-zone/region'
import {
  BetaInfo,
  ExternalId,
  Geometry,
  Name,
  Seasonality,
  Url,
} from '@climb-zone/shared'
import { CragId } from '../value-objects/crag-id.vo'

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
    public readonly geometry: Geometry | null,
    public readonly seasonality: Seasonality,
    public readonly beta: BetaInfo,
    public readonly sourceUrl: Url,
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

  toJSON(): Record<string, unknown> {
    return {
      id: this.id.toString(),
      externalId: this.externalId.toNumber(),
      countryId: this.countryId.toString(),
      regionId: this.regionId?.toString() ?? null,
      name: this.name.toString(),
      latitude: this.latitude,
      longitude: this.longitude,
      geometry: this.geometry?.toJSON(),
      seasonality: this.seasonality.toArray(),
      description: this.description,
      approach: this.approach,
      ethic: this.ethic,
      sourceUrl: this.sourceUrl.toString(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
