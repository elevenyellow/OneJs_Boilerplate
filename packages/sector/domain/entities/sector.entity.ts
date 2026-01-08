import {
  BetaInfo,
  Coordinates,
  ExternalId,
  Geometry,
  Name,
  Seasonality,
} from '@climb-zone/shared'
import { SectorId } from '../value-objects/sector-id.vo'
import { AreaId } from '@area/domain/value-objects/area-id.vo'
import { SectorStats } from '../value-objects/sector-stats.vo'
import { PriceCategory } from '../value-objects/price-category.vo'
import { Kudos } from '../value-objects/kudos.vo'

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
    public readonly type: SectorType,
    public readonly geometry: Geometry | null,
    public readonly seasonality: Seasonality,
    public readonly beta: BetaInfo,
    public readonly stats: SectorStats,
    public readonly priceCategory: PriceCategory | null,
    public readonly hasTopo: boolean,
    public readonly kudos: Kudos | null,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
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

  toJSON(): Record<string, unknown> {
    return {
      id: this.id.toString(),
      externalId: this.externalId.toNumber(),
      areaId: this.areaId.toString(),
      name: this.name.toString(),
      type: this.type,
      latitude: this.latitude,
      longitude: this.longitude,
      geometry: this.geometry?.toJSON(),
      seasonality: this.seasonality.toArray(),
      beta: this.beta.toJSON(),
      stats: this.stats.toJSON(),
      priceCategory: this.priceCategory?.toString() ?? null,
      hasTopo: this.hasTopo,
      kudos: this.kudos?.toNumber() ?? null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
