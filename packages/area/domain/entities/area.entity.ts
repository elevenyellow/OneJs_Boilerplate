import { BetaInfo, ExternalId, Geometry, Name } from '@climb-zone/shared'
import { AreaId } from '../value-objects/area-id.vo'
import { CragId } from '@crag/domain/value-objects/crag-id.vo'

export type AreaType = 'Area' | 'Cliff'

/**
 * Area Entity - Represents an intermediate grouping within a Crag
 * Can be nested (Area > Cliff > Sector)
 * Examples: "Chulilla Town", "Pared de Enfrente"
 *
 * parentAreaId is null when the area is directly under the crag.
 * When it has a value, the area is nested inside another area.
 */
export class AreaEntity {
  constructor(
    public readonly id: AreaId,
    public readonly externalId: ExternalId,
    public readonly cragId: CragId,
    public readonly parentAreaId: AreaId | null,
    public readonly name: Name,
    public readonly type: AreaType,
    public readonly geometry: Geometry | null,
    public readonly beta: BetaInfo,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  get latitude(): number | null {
    return this.geometry?.lat ?? null
  }

  get longitude(): number | null {
    return this.geometry?.long ?? null
  }

  isNested(): boolean {
    return this.parentAreaId !== null
  }

  isCliff(): boolean {
    return this.type === 'Cliff'
  }

  getDescription(): string | null {
    return this.beta.getDescription()
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id.toString(),
      externalId: this.externalId.toNumber(),
      cragId: this.cragId.toString(),
      parentAreaId: this.parentAreaId?.toString() ?? null,
      name: this.name.toString(),
      type: this.type,
      latitude: this.latitude,
      longitude: this.longitude,
      geometry: this.geometry?.toJSON(),
      beta: this.beta.toJSON(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
