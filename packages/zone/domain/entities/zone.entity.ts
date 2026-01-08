import { Coordinates } from '../value-objects/coordinates'
import { ZoneId } from '../value-objects/id'

export type ClimbingType =
  | 'sport'
  | 'trad'
  | 'boulder'
  | 'multi-pitch'
  | 'mixed'
export type GradeSystem = 'french' | 'yds' | 'uiaa' | 'v-scale' | 'font'

export interface GradeRange {
  min: string
  max: string
  system: GradeSystem
}

export interface ZoneStats {
  totalRoutes: number
  routesByType: Record<ClimbingType, number>
  gradeDistribution: Record<string, number>
}

export class ZoneEntity {
  constructor(
    public readonly id: ZoneId,
    public name: string,
    public description: string,
    public country: string,
    public region: string,
    public coordinates: Coordinates,
    public climbingTypes: ClimbingType[],
    public gradeRange: GradeRange,
    public stats: ZoneStats,
    public theCragUrl: string,
    public imageUrl?: string,
    public altitude?: number,
    public approach?: string,
    public bestSeasons?: string[],
    public createdAt?: Date,
    public updatedAt?: Date,
  ) {}

  touch(): void {
    this.updatedAt = new Date()
  }

  hasClimbingType(type: ClimbingType): boolean {
    return this.climbingTypes.includes(type)
  }

  distanceTo(coords: Coordinates): number {
    return this.coordinates.distanceTo(coords)
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id.toString(),
      name: this.name,
      description: this.description,
      country: this.country,
      region: this.region,
      coordinates: this.coordinates.toJSON(),
      climbingTypes: this.climbingTypes,
      gradeRange: this.gradeRange,
      stats: this.stats,
      theCragUrl: this.theCragUrl,
      imageUrl: this.imageUrl,
      altitude: this.altitude,
      approach: this.approach,
      bestSeasons: this.bestSeasons,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
