import type { ClimbType } from '../entities/climbing-zone.entity'

export interface ScrapedZoneData {
  externalId: string
  name: string
  country: string
  region?: string
  latitude: number
  longitude: number
  routeCount: number
  climbTypes: ClimbType[]
  minGrade?: string
  maxGrade?: string
  description?: string
  accessInfo?: string
  imageUrl?: string
  sourceUrl: string
}

export class ScrapedZoneDto {
  constructor(
    public readonly externalId: string,
    public readonly name: string,
    public readonly country: string,
    public readonly region: string | null,
    public readonly latitude: number,
    public readonly longitude: number,
    public readonly routeCount: number,
    public readonly climbTypes: ClimbType[],
    public readonly minGrade: string | null,
    public readonly maxGrade: string | null,
    public readonly description: string | null,
    public readonly accessInfo: string | null,
    public readonly imageUrl: string | null,
    public readonly sourceUrl: string,
  ) {}

  static fromScrapedData(data: ScrapedZoneData): ScrapedZoneDto {
    return new ScrapedZoneDto(
      data.externalId,
      data.name,
      data.country,
      data.region ?? null,
      data.latitude,
      data.longitude,
      data.routeCount,
      data.climbTypes,
      data.minGrade ?? null,
      data.maxGrade ?? null,
      data.description ?? null,
      data.accessInfo ?? null,
      data.imageUrl ?? null,
      data.sourceUrl,
    )
  }

  isValid(): boolean {
    return !!(
      this.externalId &&
      this.name &&
      this.country &&
      this.sourceUrl &&
      this.isValidCoordinates()
    )
  }

  private isValidCoordinates(): boolean {
    return (
      this.latitude >= -90 &&
      this.latitude <= 90 &&
      this.longitude >= -180 &&
      this.longitude <= 180
    )
  }
}
