/**
 * SectorTags Value Object
 * Processes and normalizes tags from TheCrag into structured boolean flags
 * and categorical information useful for filtering and display
 */

export interface SectorTagsData {
  kidFriendly: boolean | null
  dogFriendly: boolean | null
  accessible: boolean | null // Wheelchair or easy access
  camping: boolean | null // Camping available nearby
  swimming: boolean | null // Swimming available nearby
  scenic: boolean | null // Scenic views
  popular: boolean | null // Popular/crowded
  quiet: boolean | null // Quiet/uncrowded
  multipitch: boolean | null // Has multipitch routes
  trad: boolean | null // Trad climbing available
  sport: boolean | null // Sport climbing available
  bouldering: boolean | null // Bouldering available
  beginner: boolean | null // Good for beginners
  rawTags: string[] // List of all tag strings found
}

/**
 * Value Object for processed sector tags
 * Extracts useful boolean flags from raw TheCrag tags
 */
export class SectorTags {
  private constructor(
    public readonly kidFriendly: boolean | null,
    public readonly dogFriendly: boolean | null,
    public readonly accessible: boolean | null,
    public readonly camping: boolean | null,
    public readonly swimming: boolean | null,
    public readonly scenic: boolean | null,
    public readonly popular: boolean | null,
    public readonly quiet: boolean | null,
    public readonly multipitch: boolean | null,
    public readonly trad: boolean | null,
    public readonly sport: boolean | null,
    public readonly bouldering: boolean | null,
    public readonly beginner: boolean | null,
    public readonly rawTags: string[],
  ) {}

  /**
   * Create SectorTags from raw TheCrag tags object
   */
  static create(tagsRaw: Record<string, unknown> | null): SectorTags {
    if (!tagsRaw) {
      return SectorTags.empty()
    }

    // Collect all tag strings for inspection
    const rawTags = this.extractAllTagStrings(tagsRaw)
    const allTagsLower = rawTags.map((t) => t.toLowerCase())

    // Kid friendly detection
    const kidFriendly = this.detectTag(allTagsLower, [
      'kid friendly',
      'kid-friendly',
      'kidfriendly',
      'kids',
      'family friendly',
      'family-friendly',
      'familyfriendly',
      'family',
      'children',
      'child friendly',
      'child-friendly',
      'para niños',
      'niños',
      'familiar',
      'apto para niños',
      'enfants',
      'kinderfreundlich',
      'kinder',
    ])

    // Not kid friendly detection (explicit negative)
    const notKidFriendly = this.detectTag(allTagsLower, [
      'not kid friendly',
      'not family friendly',
      'no kids',
      'adults only',
      'dangerous for children',
      'no apto para niños',
      'peligroso para niños',
    ])

    // Dog friendly
    const dogFriendly = this.detectTag(allTagsLower, [
      'dog friendly',
      'dog-friendly',
      'dogfriendly',
      'dogs allowed',
      'dogs',
      'perros',
      'mascotas',
      'pets',
      'pet friendly',
      'chiens',
      'hundefreundlich',
    ])

    // Accessible
    const accessible = this.detectTag(allTagsLower, [
      'accessible',
      'wheelchair',
      'wheelchair accessible',
      'easy access',
      'accesible',
      'silla de ruedas',
      'accessible pmr',
      'handicap',
      'handicapped',
      'barrierefreiheit',
    ])

    // Camping
    const camping = this.detectTag(allTagsLower, [
      'camping',
      'campsite',
      'camp',
      'tent',
      'bivouac',
      'acampada',
      'camping nearby',
      'campingplatz',
    ])

    // Swimming
    const swimming = this.detectTag(allTagsLower, [
      'swimming',
      'swim',
      'lake',
      'river',
      'beach',
      'water',
      'natación',
      'playa',
      'río',
      'lago',
      'baignade',
      'schwimmen',
    ])

    // Scenic
    const scenic = this.detectTag(allTagsLower, [
      'scenic',
      'beautiful',
      'views',
      'panoramic',
      'vista',
      'paisaje',
      'vistas',
      'hermoso',
      'panoramique',
      'aussicht',
    ])

    // Popular
    const popular = this.detectTag(allTagsLower, [
      'popular',
      'crowded',
      'busy',
      'touristic',
      'famous',
      'concurrido',
      'populaire',
      'beliebt',
    ])

    // Quiet
    const quiet = this.detectTag(allTagsLower, [
      'quiet',
      'uncrowded',
      'peaceful',
      'remote',
      'isolated',
      'tranquilo',
      'aislado',
      'calme',
      'ruhig',
    ])

    // Multipitch
    const multipitch = this.detectTag(allTagsLower, [
      'multipitch',
      'multi-pitch',
      'multi pitch',
      'long routes',
      'largos',
      'multilargo',
      'grandes voies',
      'mehrseillängen',
    ])

    // Trad
    const trad = this.detectTag(allTagsLower, [
      'trad',
      'traditional',
      'trad climbing',
      'crack',
      'cracks',
      'fisuras',
      'tradklettern',
    ])

    // Sport
    const sport = this.detectTag(allTagsLower, [
      'sport',
      'sport climbing',
      'bolted',
      'equipped',
      'deportiva',
      'equipado',
      'sportkletter',
    ])

    // Bouldering
    const bouldering = this.detectTag(allTagsLower, [
      'bouldering',
      'boulder',
      'boulders',
      'bloc',
      'bloque',
      'búlder',
      'bouldern',
    ])

    // Beginner friendly
    const beginner = this.detectTag(allTagsLower, [
      'beginner',
      'beginners',
      'beginner friendly',
      'easy',
      'novice',
      'principiante',
      'principiantes',
      'fácil',
      'débutant',
      'anfänger',
    ])

    // Determine final kidFriendly value
    let finalKidFriendly: boolean | null = null
    if (notKidFriendly) {
      finalKidFriendly = false
    } else if (kidFriendly) {
      finalKidFriendly = true
    }

    return new SectorTags(
      finalKidFriendly,
      dogFriendly ? true : null,
      accessible ? true : null,
      camping ? true : null,
      swimming ? true : null,
      scenic ? true : null,
      popular ? true : null,
      quiet ? true : null,
      multipitch ? true : null,
      trad ? true : null,
      sport ? true : null,
      bouldering ? true : null,
      beginner ? true : null,
      rawTags,
    )
  }

  /**
   * Extract all string values from the tags object recursively
   */
  private static extractAllTagStrings(
    obj: Record<string, unknown>,
    collected: string[] = [],
  ): string[] {
    for (const key of Object.keys(obj)) {
      // Add the key itself as it might contain useful info
      collected.push(key)

      const value = obj[key]
      if (typeof value === 'string') {
        collected.push(value)
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        // Some tags might have boolean/number values, add the key
        // already added above
      } else if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === 'string') {
            collected.push(item)
          } else if (typeof item === 'object' && item !== null) {
            this.extractAllTagStrings(
              item as Record<string, unknown>,
              collected,
            )
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        this.extractAllTagStrings(value as Record<string, unknown>, collected)
      }
    }
    return collected
  }

  /**
   * Detect if any of the keywords are present in the tags
   */
  private static detectTag(allTags: string[], keywords: string[]): boolean {
    for (const tag of allTags) {
      for (const keyword of keywords) {
        if (tag.includes(keyword) || keyword.includes(tag)) {
          return true
        }
      }
    }
    return false
  }

  static empty(): SectorTags {
    return new SectorTags(
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      [],
    )
  }

  static fromJSON(data: SectorTagsData | null | undefined): SectorTags {
    if (!data) return SectorTags.empty()

    return new SectorTags(
      data.kidFriendly ?? null,
      data.dogFriendly ?? null,
      data.accessible ?? null,
      data.camping ?? null,
      data.swimming ?? null,
      data.scenic ?? null,
      data.popular ?? null,
      data.quiet ?? null,
      data.multipitch ?? null,
      data.trad ?? null,
      data.sport ?? null,
      data.bouldering ?? null,
      data.beginner ?? null,
      data.rawTags ?? [],
    )
  }

  toJSON(): SectorTagsData {
    return {
      kidFriendly: this.kidFriendly,
      dogFriendly: this.dogFriendly,
      accessible: this.accessible,
      camping: this.camping,
      swimming: this.swimming,
      scenic: this.scenic,
      popular: this.popular,
      quiet: this.quiet,
      multipitch: this.multipitch,
      trad: this.trad,
      sport: this.sport,
      bouldering: this.bouldering,
      beginner: this.beginner,
      rawTags: this.rawTags,
    }
  }

  /**
   * Check if the sector is explicitly marked as kid friendly
   */
  isKidFriendly(): boolean {
    return this.kidFriendly === true
  }

  /**
   * Check if the sector is explicitly marked as NOT kid friendly
   */
  isNotKidFriendly(): boolean {
    return this.kidFriendly === false
  }

  /**
   * Check if kid friendliness is unknown
   */
  isKidFriendlyUnknown(): boolean {
    return this.kidFriendly === null
  }

  /**
   * Check if good for families (kid friendly, accessible, beginner)
   */
  isGoodForFamilies(): boolean {
    return (
      this.kidFriendly === true ||
      this.beginner === true ||
      this.accessible === true
    )
  }

  /**
   * Check if outdoor activities are available (camping, swimming)
   */
  hasOutdoorActivities(): boolean {
    return this.camping === true || this.swimming === true
  }

  /**
   * Check if any processed tags are available
   */
  hasAnyTags(): boolean {
    return (
      this.kidFriendly !== null ||
      this.dogFriendly !== null ||
      this.accessible !== null ||
      this.camping !== null ||
      this.swimming !== null ||
      this.scenic !== null ||
      this.popular !== null ||
      this.quiet !== null ||
      this.multipitch !== null ||
      this.trad !== null ||
      this.sport !== null ||
      this.bouldering !== null ||
      this.beginner !== null
    )
  }

  /**
   * Get list of positive tags as strings for display
   */
  getPositiveTags(): string[] {
    const tags: string[] = []
    if (this.kidFriendly === true) tags.push('Kid Friendly')
    if (this.dogFriendly === true) tags.push('Dog Friendly')
    if (this.accessible === true) tags.push('Accessible')
    if (this.camping === true) tags.push('Camping')
    if (this.swimming === true) tags.push('Swimming')
    if (this.scenic === true) tags.push('Scenic')
    if (this.quiet === true) tags.push('Quiet')
    if (this.multipitch === true) tags.push('Multipitch')
    if (this.trad === true) tags.push('Trad')
    if (this.sport === true) tags.push('Sport')
    if (this.bouldering === true) tags.push('Bouldering')
    if (this.beginner === true) tags.push('Beginner Friendly')
    return tags
  }

  /**
   * Get list of warning tags as strings for display
   */
  getWarningTags(): string[] {
    const tags: string[] = []
    if (this.kidFriendly === false) tags.push('Not Kid Friendly')
    if (this.popular === true) tags.push('Can be Crowded')
    return tags
  }
}
