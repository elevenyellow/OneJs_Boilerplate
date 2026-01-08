export type ClimbType = 'sport' | 'boulder' | 'trad' | 'mixed'

export class ClimbingZoneEntity {
  constructor(
    public id: string,
    public externalId: string,
    public name: string,
    public country: string,
    public region: string | null,
    public latitude: number,
    public longitude: number,
    public routeCount: number,
    public climbTypes: ClimbType[],
    public minGrade: string | null,
    public maxGrade: string | null,
    public description: string | null,
    public accessInfo: string | null,
    public imageUrl: string | null,
    public sourceUrl: string,
    public createdAt?: Date,
    public updatedAt?: Date,
  ) {}

  static create(props: {
    id: string
    externalId: string
    name: string
    country: string
    region?: string | null
    latitude: number
    longitude: number
    routeCount?: number
    climbTypes?: ClimbType[]
    minGrade?: string | null
    maxGrade?: string | null
    description?: string | null
    accessInfo?: string | null
    imageUrl?: string | null
    sourceUrl: string
  }): ClimbingZoneEntity {
    return new ClimbingZoneEntity(
      props.id,
      props.externalId,
      props.name,
      props.country,
      props.region ?? null,
      props.latitude,
      props.longitude,
      props.routeCount ?? 0,
      props.climbTypes ?? [],
      props.minGrade ?? null,
      props.maxGrade ?? null,
      props.description ?? null,
      props.accessInfo ?? null,
      props.imageUrl ?? null,
      props.sourceUrl,
    )
  }

  updateFrom(scrapedData: Partial<ClimbingZoneEntity>): void {
    if (scrapedData.name) this.name = scrapedData.name
    if (scrapedData.routeCount !== undefined)
      this.routeCount = scrapedData.routeCount
    if (scrapedData.climbTypes) this.climbTypes = scrapedData.climbTypes
    if (scrapedData.minGrade !== undefined) this.minGrade = scrapedData.minGrade
    if (scrapedData.maxGrade !== undefined) this.maxGrade = scrapedData.maxGrade
    if (scrapedData.description !== undefined)
      this.description = scrapedData.description
    if (scrapedData.accessInfo !== undefined)
      this.accessInfo = scrapedData.accessInfo
    if (scrapedData.imageUrl !== undefined) this.imageUrl = scrapedData.imageUrl
    this.updatedAt = new Date()
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      externalId: this.externalId,
      name: this.name,
      country: this.country,
      region: this.region,
      latitude: this.latitude,
      longitude: this.longitude,
      routeCount: this.routeCount,
      climbTypes: this.climbTypes,
      minGrade: this.minGrade,
      maxGrade: this.maxGrade,
      description: this.description,
      accessInfo: this.accessInfo,
      imageUrl: this.imageUrl,
      sourceUrl: this.sourceUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
