/**
 * Zone Metadata Value Object
 * Contains structured data for hybrid filtering in semantic search
 */

export interface ZoneMetadataData {
  location: {
    lat: number
    lon: number
    locatedness?: number
  }
  grades: {
    min: number | null
    max: number | null
    avg: number | null
    distribution: Record<string, number>
  }
  routeCount: number
  seasonality: {
    scores: number[] // 12 normalized values [0-1]
    bestMonths: number[]
  }
  approach?: {
    timeMin: number | null
    difficulty: 'easy' | 'moderate' | 'difficult' | null
  }
  characteristics: {
    orientations: string[]
    rockTypes: string[]
    climbingStyles: string[]
    sunExposure: string | null
    sheltered: boolean | null
  }
  quality: {
    popularity: number // 0-1 normalized
    rating: number // 0-1 normalized
  }
  facilities: {
    hasTopos: boolean
    hasPhotos: boolean
    requiresPermit: boolean
    priceCategory: string | null
  }
  routeTypes: {
    sport: boolean
    trad: boolean
    boulder: boolean
    multiPitch: boolean
  }
  stats?: {
    avgHeight: number | null
    totalAscents: number | null
    numberPhotos: number | null
    numberTopos: number | null
  }
}

export class ZoneMetadata {
  private constructor(private readonly data: ZoneMetadataData) {}

  static create(data: ZoneMetadataData): ZoneMetadata {
    return new ZoneMetadata(data)
  }

  get location() {
    return this.data.location
  }

  get grades() {
    return this.data.grades
  }

  get routeCount() {
    return this.data.routeCount
  }

  get seasonality() {
    return this.data.seasonality
  }

  get approach() {
    return this.data.approach
  }

  get characteristics() {
    return this.data.characteristics
  }

  get quality() {
    return this.data.quality
  }

  get facilities() {
    return this.data.facilities
  }

  get routeTypes() {
    return this.data.routeTypes
  }

  get stats() {
    return this.data.stats
  }

  /**
   * Check if zone is good for climbing in a specific month
   */
  isGoodForMonth(month: number): boolean {
    if (month < 1 || month > 12) return false
    return this.data.seasonality.scores[month - 1] >= 0.6
  }

  /**
   * Check if zone has routes within the specified grade range
   */
  hasGradeInRange(minIndex: number, maxIndex: number): boolean {
    if (!this.data.grades.min || !this.data.grades.max) return true
    return !(
      this.data.grades.max < minIndex || this.data.grades.min > maxIndex
    )
  }

  /**
   * Check if zone is popular
   */
  isPopular(): boolean {
    return this.data.quality.popularity >= 0.7
  }

  /**
   * Check if zone is high quality
   */
  isHighQuality(): boolean {
    return this.data.quality.rating >= 0.7
  }

  /**
   * Check if zone has accurate location
   */
  hasAccurateLocation(): boolean {
    return (this.data.location.locatedness || 0) >= 50
  }

  toJSON(): ZoneMetadataData {
    return { ...this.data }
  }

  toString(): string {
    return JSON.stringify(this.data, null, 2)
  }
}
