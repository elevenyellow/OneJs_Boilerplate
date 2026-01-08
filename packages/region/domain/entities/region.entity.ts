import { CountryId } from '@climb-zone/country'
import { ExternalId, Geometry, Name } from '@climb-zone/shared'
import { RegionId } from '../value-objects/region-id.vo'

/**
 * Region Entity - Represents a geographical region within a country
 * Examples: Comunidad Valenciana, Catalunya, Aragón
 *
 * A Region always belongs to a Country (required).
 * Regions contain Crags.
 */
export class RegionEntity {
  constructor(
    public readonly id: RegionId,
    public readonly externalId: ExternalId,
    public readonly countryId: CountryId,
    public readonly name: Name,
    public readonly geometry: Geometry | null,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  get latitude(): number | null {
    return this.geometry?.lat ?? null
  }

  get longitude(): number | null {
    return this.geometry?.long ?? null
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id.toString(),
      externalId: this.externalId.toNumber(),
      countryId: this.countryId.toString(),
      name: this.name.toString(),
      latitude: this.latitude,
      longitude: this.longitude,
      geometry: this.geometry?.toJSON(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
