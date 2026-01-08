export type RouteType = 'sport' | 'boulder' | 'trad' | 'mixed'

export class ClimbingRouteEntity {
  constructor(
    public id: string,
    public externalId: string,
    public zoneId: string,
    public name: string,
    public grade: string,
    public gradeSystem: string,
    public routeType: RouteType,
    public height: number | null,
    public bolts: number | null,
    public description: string | null,
    public rating: number | null,
    public ascentCount: number,
    public sourceUrl: string,
    public createdAt?: Date,
    public updatedAt?: Date,
  ) {}

  static create(props: {
    id: string
    externalId: string
    zoneId: string
    name: string
    grade: string
    gradeSystem?: string
    routeType: RouteType
    height?: number | null
    bolts?: number | null
    description?: string | null
    rating?: number | null
    ascentCount?: number
    sourceUrl: string
  }): ClimbingRouteEntity {
    return new ClimbingRouteEntity(
      props.id,
      props.externalId,
      props.zoneId,
      props.name,
      props.grade,
      props.gradeSystem ?? 'french',
      props.routeType,
      props.height ?? null,
      props.bolts ?? null,
      props.description ?? null,
      props.rating ?? null,
      props.ascentCount ?? 0,
      props.sourceUrl,
    )
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      externalId: this.externalId,
      zoneId: this.zoneId,
      name: this.name,
      grade: this.grade,
      gradeSystem: this.gradeSystem,
      routeType: this.routeType,
      height: this.height,
      bolts: this.bolts,
      description: this.description,
      rating: this.rating,
      ascentCount: this.ascentCount,
      sourceUrl: this.sourceUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
