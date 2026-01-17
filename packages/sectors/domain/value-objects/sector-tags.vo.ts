/**
 * Normalized enums for sector tag categories.
 * These enums provide type-safe, queryable values extracted from the raw tags JSON.
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Cardinal direction aspect of the sector (orientation)
 */
export enum AspectDirection {
  N = 'N',
  NE = 'NE',
  E = 'E',
  SE = 'SE',
  S = 'S',
  SW = 'SW',
  W = 'W',
  NW = 'NW',
}

/**
 * Normalized walk-in time categories
 */
export enum WalkInTime {
  UNDER_5_MIN = 'UNDER_5_MIN',
  FROM_5_TO_10_MIN = 'FROM_5_TO_10_MIN',
  FROM_10_TO_20_MIN = 'FROM_10_TO_20_MIN',
  FROM_20_TO_30_MIN = 'FROM_20_TO_30_MIN',
  FROM_30_TO_45_MIN = 'FROM_30_TO_45_MIN',
  FROM_45_TO_60_MIN = 'FROM_45_TO_60_MIN',
  OVER_60_MIN = 'OVER_60_MIN',
}

/**
 * Family-friendly status
 */
export enum FamilyFriendly {
  KID_FRIENDLY = 'KID_FRIENDLY',
  NOT_KID_FRIENDLY = 'NOT_KID_FRIENDLY',
}

/**
 * Weather/sun conditions
 */
export enum WeatherCondition {
  ALL_DAY_SUN = 'ALL_DAY_SUN',
  MORNING_SUN = 'MORNING_SUN',
  NOON_SUN = 'NOON_SUN',
  AFTERNOON_SUN = 'AFTERNOON_SUN',
  ALL_DAY_SHADE = 'ALL_DAY_SHADE',
  MORNING_SHADE = 'MORNING_SHADE',
  AFTERNOON_SHADE = 'AFTERNOON_SHADE',
}

/**
 * Crowd level at the sector
 */
export enum CrowdLevel {
  DESERTED = 'DESERTED',
  QUIET = 'QUIET',
  BUSY = 'BUSY',
  CROWDED = 'CROWDED',
}

/**
 * Climbing style of the sector
 */
export enum ClimbingStyle {
  SLAB = 'SLAB',
  VERTICAL = 'VERTICAL',
  OVERHANG = 'OVERHANG',
  ROOF = 'ROOF',
  CRACK = 'CRACK',
  ARETE = 'ARETE',
  CORNER = 'CORNER',
  CHIMNEY = 'CHIMNEY',
}

// ============================================================================
// RAW TAG DATA TYPES
// ============================================================================

export type TagsData = Record<string, unknown>

interface TagItem {
  id?: number | string
  name?: string
  hasIcon?: number
}

type TagCategory = Record<string, TagItem>

// ============================================================================
// PARSED SECTOR TAGS INTERFACE
// ============================================================================

export interface ParsedSectorTags {
  aspect: AspectDirection | null
  walkInTime: WalkInTime | null
  family: FamilyFriendly | null
  weather: WeatherCondition[]
  crowds: CrowdLevel | null
  style: ClimbingStyle | null
}

// ============================================================================
// PARSER MAPS
// ============================================================================

const ASPECT_MAP: Record<string, AspectDirection> = {
  N: AspectDirection.N,
  NE: AspectDirection.NE,
  E: AspectDirection.E,
  SE: AspectDirection.SE,
  S: AspectDirection.S,
  SW: AspectDirection.SW,
  W: AspectDirection.W,
  NW: AspectDirection.NW,
}

const WALK_IN_TIME_MAP: Record<string, WalkInTime> = {
  '<5 min': WalkInTime.UNDER_5_MIN,
  '5-10 min': WalkInTime.FROM_5_TO_10_MIN,
  '10-20 min': WalkInTime.FROM_10_TO_20_MIN,
  '20-30 min': WalkInTime.FROM_20_TO_30_MIN,
  '30-45 min': WalkInTime.FROM_30_TO_45_MIN,
  '45-60 min': WalkInTime.FROM_45_TO_60_MIN,
  '>60 min': WalkInTime.OVER_60_MIN,
  '60+ min': WalkInTime.OVER_60_MIN,
}

const FAMILY_MAP: Record<string, FamilyFriendly> = {
  'Kid friendly': FamilyFriendly.KID_FRIENDLY,
  'Not kid friendly': FamilyFriendly.NOT_KID_FRIENDLY,
}

const WEATHER_MAP: Record<string, WeatherCondition> = {
  'All day sun': WeatherCondition.ALL_DAY_SUN,
  'Morning sun': WeatherCondition.MORNING_SUN,
  'Noon sun': WeatherCondition.NOON_SUN,
  'Afternoon sun': WeatherCondition.AFTERNOON_SUN,
  'All day shade': WeatherCondition.ALL_DAY_SHADE,
  'Morning shade': WeatherCondition.MORNING_SHADE,
  'Afternoon shade': WeatherCondition.AFTERNOON_SHADE,
}

const CROWDS_MAP: Record<string, CrowdLevel> = {
  Deserted: CrowdLevel.DESERTED,
  Quiet: CrowdLevel.QUIET,
  Busy: CrowdLevel.BUSY,
  Crowded: CrowdLevel.CROWDED,
}

const STYLE_MAP: Record<string, ClimbingStyle> = {
  Slab: ClimbingStyle.SLAB,
  Vertical: ClimbingStyle.VERTICAL,
  Overhang: ClimbingStyle.OVERHANG,
  Roof: ClimbingStyle.ROOF,
  Crack: ClimbingStyle.CRACK,
  Arete: ClimbingStyle.ARETE,
  Arête: ClimbingStyle.ARETE,
  Corner: ClimbingStyle.CORNER,
  Chimney: ClimbingStyle.CHIMNEY,
}

// ============================================================================
// SECTOR TAGS VALUE OBJECT
// ============================================================================

export class SectorTags {
  private readonly rawData: TagsData | null
  private readonly parsed: ParsedSectorTags

  private constructor(rawData: TagsData | null, parsed: ParsedSectorTags) {
    this.rawData = rawData
    this.parsed = parsed
  }

  /**
   * Creates a SectorTags from raw JSON data, parsing and normalizing values
   */
  static createFrom(data: TagsData | null | undefined): SectorTags {
    if (!data) {
      return new SectorTags(null, {
        aspect: null,
        walkInTime: null,
        family: null,
        weather: [],
        crowds: null,
        style: null,
      })
    }

    const parsed = SectorTags.parseTagsData(data)
    return new SectorTags(data, parsed)
  }

  /**
   * Creates an empty SectorTags
   */
  static createEmpty(): SectorTags {
    return SectorTags.createFrom(null)
  }

  /**
   * Creates SectorTags from already parsed atomic values (from database)
   */
  static createFromAtomic(
    rawData: TagsData | null,
    aspect: string | null,
    walkInTime: string | null,
    family: string | null,
    weather: string[],
    crowds: string | null,
    style: string | null,
  ): SectorTags {
    const parsed: ParsedSectorTags = {
      aspect: aspect as AspectDirection | null,
      walkInTime: walkInTime as WalkInTime | null,
      family: family as FamilyFriendly | null,
      weather: weather as WeatherCondition[],
      crowds: crowds as CrowdLevel | null,
      style: style as ClimbingStyle | null,
    }
    return new SectorTags(rawData, parsed)
  }

  // ============================================================================
  // PARSING LOGIC
  // ============================================================================

  private static parseTagsData(data: TagsData): ParsedSectorTags {
    return {
      aspect: this.parseAspect(data),
      walkInTime: this.parseWalkInTime(data),
      family: this.parseFamily(data),
      weather: this.parseWeather(data),
      crowds: this.parseCrowds(data),
      style: this.parseStyle(data),
    }
  }

  private static parseAspect(data: TagsData): AspectDirection | null {
    const aspectCategory = data['Aspect'] as TagCategory | undefined
    if (!aspectCategory) return null

    const keys = Object.keys(aspectCategory)
    for (const key of keys) {
      if (ASPECT_MAP[key]) {
        return ASPECT_MAP[key]
      }
    }
    return null
  }

  private static parseWalkInTime(data: TagsData): WalkInTime | null {
    const category = data['Walk in time'] as TagCategory | undefined
    if (!category) return null

    const keys = Object.keys(category)
    for (const key of keys) {
      if (WALK_IN_TIME_MAP[key]) {
        return WALK_IN_TIME_MAP[key]
      }
    }
    return null
  }

  private static parseFamily(data: TagsData): FamilyFriendly | null {
    const category = data['Family'] as TagCategory | undefined
    if (!category) return null

    const keys = Object.keys(category)
    for (const key of keys) {
      if (FAMILY_MAP[key]) {
        return FAMILY_MAP[key]
      }
    }
    return null
  }

  private static parseWeather(data: TagsData): WeatherCondition[] {
    const category = data['Weather'] as TagCategory | undefined
    if (!category) return []

    const conditions: WeatherCondition[] = []
    const keys = Object.keys(category)
    for (const key of keys) {
      if (WEATHER_MAP[key]) {
        conditions.push(WEATHER_MAP[key])
      }
    }
    return conditions
  }

  private static parseCrowds(data: TagsData): CrowdLevel | null {
    const category = data['Crowds'] as TagCategory | undefined
    if (!category) return null

    const keys = Object.keys(category)
    for (const key of keys) {
      if (CROWDS_MAP[key]) {
        return CROWDS_MAP[key]
      }
    }
    return null
  }

  private static parseStyle(data: TagsData): ClimbingStyle | null {
    const category = data['Style'] as TagCategory | undefined
    if (!category) return null

    const keys = Object.keys(category)
    for (const key of keys) {
      if (STYLE_MAP[key]) {
        return STYLE_MAP[key]
      }
    }
    return null
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  getRawData(): TagsData | null {
    return this.rawData ? { ...this.rawData } : null
  }

  getAspect(): AspectDirection | null {
    return this.parsed.aspect
  }

  getWalkInTime(): WalkInTime | null {
    return this.parsed.walkInTime
  }

  getFamily(): FamilyFriendly | null {
    return this.parsed.family
  }

  getWeather(): WeatherCondition[] {
    return [...this.parsed.weather]
  }

  getCrowds(): CrowdLevel | null {
    return this.parsed.crowds
  }

  getStyle(): ClimbingStyle | null {
    return this.parsed.style
  }

  getParsed(): ParsedSectorTags {
    return { ...this.parsed, weather: [...this.parsed.weather] }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  hasData(): boolean {
    return this.rawData !== null && Object.keys(this.rawData).length > 0
  }

  hasAtomicData(): boolean {
    return (
      this.parsed.aspect !== null ||
      this.parsed.walkInTime !== null ||
      this.parsed.family !== null ||
      this.parsed.weather.length > 0 ||
      this.parsed.crowds !== null ||
      this.parsed.style !== null
    )
  }

  toJSON(): TagsData | null {
    return this.rawData
  }

  equals(other: SectorTags): boolean {
    return JSON.stringify(this.rawData) === JSON.stringify(other.rawData)
  }

  toString(): string {
    return JSON.stringify(this.rawData)
  }

  // ============================================================================
  // HUMAN-READABLE FORMATTERS
  // ============================================================================

  /**
   * Get human-readable aspect direction in Spanish
   * @returns Formatted aspect string (e.g., "Norte", "Sureste") or null
   */
  getAspectLabel(): string | null {
    if (!this.parsed.aspect) return null

    const aspectLabels: Record<AspectDirection, string> = {
      [AspectDirection.N]: 'Norte',
      [AspectDirection.NE]: 'Noreste',
      [AspectDirection.E]: 'Este',
      [AspectDirection.SE]: 'Sureste',
      [AspectDirection.S]: 'Sur',
      [AspectDirection.SW]: 'Suroeste',
      [AspectDirection.W]: 'Oeste',
      [AspectDirection.NW]: 'Noroeste',
    }

    return aspectLabels[this.parsed.aspect]
  }

  /**
   * Get human-readable walk-in time in Spanish
   * @returns Formatted time string (e.g., "< 5 min", "10-20 min") or null
   */
  getWalkInTimeLabel(): string | null {
    if (!this.parsed.walkInTime) return null

    const timeLabels: Record<WalkInTime, string> = {
      [WalkInTime.UNDER_5_MIN]: '< 5 min',
      [WalkInTime.FROM_5_TO_10_MIN]: '5-10 min',
      [WalkInTime.FROM_10_TO_20_MIN]: '10-20 min',
      [WalkInTime.FROM_20_TO_30_MIN]: '20-30 min',
      [WalkInTime.FROM_30_TO_45_MIN]: '30-45 min',
      [WalkInTime.FROM_45_TO_60_MIN]: '45-60 min',
      [WalkInTime.OVER_60_MIN]: '> 60 min',
    }

    return timeLabels[this.parsed.walkInTime]
  }

  /**
   * Get human-readable family status in Spanish
   * @returns Formatted family string (e.g., "Apto niños") or null
   */
  getFamilyLabel(): string | null {
    if (!this.parsed.family) return null

    const familyLabels: Record<FamilyFriendly, string> = {
      [FamilyFriendly.KID_FRIENDLY]: 'Apto niños',
      [FamilyFriendly.NOT_KID_FRIENDLY]: 'No apto niños',
    }

    return familyLabels[this.parsed.family]
  }

  /**
   * Get human-readable weather conditions in Spanish
   * @returns Array of formatted weather strings or empty array
   */
  getWeatherLabels(): string[] {
    if (this.parsed.weather.length === 0) return []

    const weatherLabels: Record<WeatherCondition, string> = {
      [WeatherCondition.ALL_DAY_SUN]: 'Sol todo el día',
      [WeatherCondition.MORNING_SUN]: 'Sol mañana',
      [WeatherCondition.NOON_SUN]: 'Sol mediodía',
      [WeatherCondition.AFTERNOON_SUN]: 'Sol tarde',
      [WeatherCondition.ALL_DAY_SHADE]: 'Sombra todo el día',
      [WeatherCondition.MORNING_SHADE]: 'Sombra mañana',
      [WeatherCondition.AFTERNOON_SHADE]: 'Sombra tarde',
    }

    return this.parsed.weather.map((w) => weatherLabels[w])
  }

  /**
   * Get human-readable crowd level in Spanish
   * @returns Formatted crowd string (e.g., "Tranquilo", "Concurrido") or null
   */
  getCrowdsLabel(): string | null {
    if (!this.parsed.crowds) return null

    const crowdsLabels: Record<CrowdLevel, string> = {
      [CrowdLevel.DESERTED]: 'Desierto',
      [CrowdLevel.QUIET]: 'Tranquilo',
      [CrowdLevel.BUSY]: 'Concurrido',
      [CrowdLevel.CROWDED]: 'Muy concurrido',
    }

    return crowdsLabels[this.parsed.crowds]
  }
}
