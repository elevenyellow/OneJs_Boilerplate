/**
 * French grade order for index calculation
 * Each grade has a base value, with + adding 2 and / adding 1
 */
const FRENCH_GRADE_ORDER: Record<string, number> = {
  '3': 10,
  '4': 20,
  '4+': 22,
  '5a': 30,
  '5a+': 32,
  '5b': 35,
  '5b+': 37,
  '5c': 40,
  '5c+': 42,
  '6a': 50,
  '6a+': 52,
  '6b': 55,
  '6b+': 57,
  '6c': 60,
  '6c+': 62,
  '7a': 70,
  '7a+': 72,
  '7b': 75,
  '7b+': 77,
  '7c': 80,
  '7c+': 82,
  '8a': 90,
  '8a+': 92,
  '8b': 95,
  '8b+': 97,
  '8c': 100,
  '8c+': 102,
  '9a': 110,
  '9a+': 112,
  '9b': 115,
  '9b+': 117,
  '9c': 120,
}

export type GradeSystem = 'french' | 'yds' | 'uiaa' | 'v-scale' | 'font'

/**
 * Value Object representing a climbing grade
 * Supports French system with index calculation for sorting
 */
export class Grade {
  public readonly index: number

  constructor(
    public readonly value: string,
    public readonly system: GradeSystem = 'french',
    index?: number,
  ) {
    this.index = index ?? this.calculateIndex()
  }

  /**
   * Calculate numeric index for sorting/comparison
   * Handles grades like "6c/c+", "7a+/b", etc.
   */
  private calculateIndex(): number {
    if (!this.value) return 0

    // Normalize grade string
    const normalized = this.value.toLowerCase().trim()

    // Handle slash grades (e.g., "6c/c+", "7a+/b")
    if (normalized.includes('/')) {
      const parts = normalized.split('/')
      const firstGrade = parts[0]
      const firstIndex = FRENCH_GRADE_ORDER[firstGrade]
      if (firstIndex) {
        return firstIndex + 1 // Midpoint
      }
    }

    // Direct lookup
    const directIndex = FRENCH_GRADE_ORDER[normalized]
    if (directIndex) return directIndex

    // Try parsing variations
    const baseMatch = normalized.match(/^(\d+)([a-c])?(\+)?/)
    if (baseMatch) {
      const [, num, letter, plus] = baseMatch
      const base = parseInt(num) * 10
      const letterOffset = letter ? (letter.charCodeAt(0) - 97) * 3 : 0
      const plusOffset = plus ? 2 : 0
      return base + letterOffset + plusOffset
    }

    return 0
  }

  /**
   * Compare to another grade
   * Returns negative if this is easier, positive if harder, 0 if equal
   */
  compareTo(other: Grade): number {
    return this.index - other.index
  }

  isHarderThan(other: Grade): boolean {
    return this.compareTo(other) > 0
  }

  isEasierThan(other: Grade): boolean {
    return this.compareTo(other) < 0
  }

  toString(): string {
    return this.value
  }

  toJSON(): { value: string; system: GradeSystem; index: number } {
    return {
      value: this.value,
      system: this.system,
      index: this.index,
    }
  }

  static fromString(grade: string, system: GradeSystem = 'french'): Grade {
    return new Grade(grade, system)
  }

  static fromIndex(index: number): Grade | null {
    for (const [grade, idx] of Object.entries(FRENCH_GRADE_ORDER)) {
      if (idx === index) {
        return new Grade(grade, 'french', index)
      }
    }
    return null
  }

  /**
   * Calculate index from a grade string (static utility)
   */
  static calculateIndexFromString(grade: string | null | undefined): number | null {
    if (!grade) return null
    return new Grade(grade).index || null
  }

  /**
   * Get grade string from index (finds closest match)
   */
  static getGradeFromIndex(index: number | null): string | null {
    if (index === null) return null
    
    // Find exact match first
    for (const [grade, idx] of Object.entries(FRENCH_GRADE_ORDER)) {
      if (idx === index) {
        return grade
      }
    }
    
    // Find closest match
    let closestGrade: string | null = null
    let closestDiff = Infinity
    
    for (const [grade, idx] of Object.entries(FRENCH_GRADE_ORDER)) {
      const diff = Math.abs(idx - index)
      if (diff < closestDiff) {
        closestDiff = diff
        closestGrade = grade
      }
    }
    
    return closestGrade
  }
}
