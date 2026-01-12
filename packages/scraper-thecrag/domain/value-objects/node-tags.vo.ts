/**
 * Raw tag entry from TheCrag API.
 */
interface RawTagEntry {
  id: number
  name: string
  hasIcon?: number
}

/**
 * Raw tags structure from TheCrag API.
 */
interface RawApiTags {
  Amenities?: Record<string, RawTagEntry>
  Aspect?: Record<string, RawTagEntry>
  Crowds?: Record<string, RawTagEntry>
  Family?: Record<string, RawTagEntry>
  'Walk in angle'?: Record<string, RawTagEntry>
  'Walk in time'?: Record<string, RawTagEntry>
  Weather?: Record<string, RawTagEntry>
  [key: string]: Record<string, RawTagEntry> | undefined
}

/**
 * Value Object representing tags for a TheCrag node.
 * Tags provide information about amenities, aspect, crowds, family-friendliness,
 * walk-in time, and weather conditions.
 */
export class NodeTags {
  private constructor(
    private readonly aspect: string | null,
    private readonly amenities: string[],
    private readonly crowds: string[],
    private readonly family: string[],
    private readonly walkInAngle: string | null,
    private readonly walkInTime: string | null,
    private readonly weather: string[],
  ) {}

  /**
   * Creates NodeTags from the API tags structure.
   */
  static fromApiTags(tags: RawApiTags): NodeTags {
    // Extract aspect (usually just one)
    const aspect = tags.Aspect ? Object.keys(tags.Aspect)[0] || null : null

    // Extract amenities list
    const amenities = tags.Amenities ? Object.keys(tags.Amenities) : []

    // Extract crowds list
    const crowds = tags.Crowds ? Object.keys(tags.Crowds) : []

    // Extract family tags
    const family = tags.Family ? Object.keys(tags.Family) : []

    // Extract walk-in angle (usually just one)
    const walkInAngle = tags['Walk in angle']
      ? Object.keys(tags['Walk in angle'])[0] || null
      : null

    // Extract walk-in time (usually just one)
    const walkInTime = tags['Walk in time']
      ? Object.keys(tags['Walk in time'])[0] || null
      : null

    // Extract weather tags
    const weather = tags.Weather ? Object.keys(tags.Weather) : []

    return new NodeTags(
      aspect,
      amenities,
      crowds,
      family,
      walkInAngle,
      walkInTime,
      weather,
    )
  }

  /**
   * Creates an empty NodeTags.
   */
  static empty(): NodeTags {
    return new NodeTags(null, [], [], [], null, null, [])
  }

  getAspect(): string | null {
    return this.aspect
  }

  getAmenities(): string[] {
    return [...this.amenities]
  }

  getCrowds(): string[] {
    return [...this.crowds]
  }

  getFamily(): string[] {
    return [...this.family]
  }

  getWalkInAngle(): string | null {
    return this.walkInAngle
  }

  getWalkInTime(): string | null {
    return this.walkInTime
  }

  getWeather(): string[] {
    return [...this.weather]
  }

  /**
   * Returns true if the area is marked as kid friendly.
   */
  isKidFriendly(): boolean {
    return this.family.some((tag) => tag.toLowerCase().includes('kid friendly'))
  }

  /**
   * Returns true if the area is marked as dog friendly.
   */
  isDogFriendly(): boolean {
    return this.family.some((tag) => tag.toLowerCase().includes('dog friendly'))
  }

  /**
   * Returns true if the area is marked as beginner friendly.
   */
  isBeginnerFriendly(): boolean {
    return this.crowds.some((tag) => tag.toLowerCase().includes('beginner'))
  }

  /**
   * Returns true if the area tends to be crowded.
   */
  isCrowded(): boolean {
    return this.crowds.some((tag) => tag.toLowerCase().includes('crowded'))
  }

  /**
   * Returns true if camping is allowed.
   */
  isCampingAllowed(): boolean {
    return !this.amenities.some((tag) =>
      tag.toLowerCase().includes('no camping'),
    )
  }

  /**
   * Returns true if the area has shade during the day.
   */
  hasShade(): boolean {
    return this.weather.some((tag) => tag.toLowerCase().includes('shade'))
  }

  /**
   * Returns true if the area gets afternoon sun.
   */
  hasAfternoonSun(): boolean {
    return this.weather.some((tag) =>
      tag.toLowerCase().includes('afternoon sun'),
    )
  }

  /**
   * Returns true if the area gets morning sun.
   */
  hasMorningSun(): boolean {
    return this.weather.some((tag) => tag.toLowerCase().includes('morning sun'))
  }

  equals(other: NodeTags): boolean {
    return (
      this.aspect === other.aspect &&
      JSON.stringify(this.amenities.sort()) ===
        JSON.stringify(other.amenities.sort()) &&
      JSON.stringify(this.crowds.sort()) ===
        JSON.stringify(other.crowds.sort()) &&
      JSON.stringify(this.family.sort()) ===
        JSON.stringify(other.family.sort()) &&
      this.walkInTime === other.walkInTime
    )
  }

  toString(): string {
    const parts: string[] = []
    if (this.aspect) parts.push(`aspect: ${this.aspect}`)
    if (this.walkInTime) parts.push(`walk: ${this.walkInTime}`)
    if (this.family.length > 0) parts.push(`family: ${this.family.join(', ')}`)
    return `Tags(${parts.join(', ')})`
  }
}
