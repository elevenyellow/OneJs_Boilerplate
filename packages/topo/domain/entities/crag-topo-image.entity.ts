import { CragId } from '@crag/domain/value-objects/crag-id.vo'
import { SectorId } from '@sector/domain/value-objects/sector-id.vo'
import { TopoImageId } from '@topo/domain/value-objects/topo-image-id.vo'

/**
 * Position of a sector on a crag topo image
 */
export interface CragTopoSectorPositionData {
  sectorId: SectorId | null
  areaNumber: string
  areaName: string
  points: string
  zindex: number
  order: number
  externalAreaId: bigint | null
  areaUrl: string | null
}

/**
 * Crag topo image entity - overview topo showing sectors
 */
export class CragTopoImageEntity {
  constructor(
    public readonly id: TopoImageId,
    public readonly externalId: string,
    public readonly cragId: CragId,
    public readonly thumbnailUrl: string,
    public readonly fullImageUrl: string,
    public readonly width: number,
    public readonly height: number,
    public readonly originalWidth: number,
    public readonly originalHeight: number,
    public readonly viewScale: number,
    public readonly sourceUrl: string | null,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}
