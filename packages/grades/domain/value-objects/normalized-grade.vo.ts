import {
  getGradeCategory,
  type GradeCategory,
} from '../services/grade-category'
import { GradeConverter } from '../services/grade-converter'
import { GradeSystemDetector } from '../services/grade-system-detector'
import type {
  GradeEquivalents,
  GradeSystem,
} from '../types/grade-systems.types'

/**
 * Labels for GradeCategory display
 */
const GRADE_CATEGORY_LABELS: Record<GradeCategory, string> = {
  easy: 'Beginner',
  medium: 'Intermediate',
  hard: 'Advanced',
  extreme: 'Expert',
}

/**
 * Colors for GradeCategory UI display
 */
const GRADE_CATEGORY_COLORS: Record<GradeCategory, string> = {
  easy: '#6ebb16', // Green
  medium: '#ffc107', // Yellow
  hard: '#e06100', // Orange
  extreme: '#c80a0f', // Red
}

/**
 * Serialized format for persistence
 */
export interface NormalizedGradeJSON {
  original: string
  detectedSystem: GradeSystem
  index: number | null
  gradeCategory: GradeCategory | null
  equivalents: GradeEquivalents
}

/**
 * NormalizedGrade Value Object
 *
 * Represents a climbing grade with automatic detection and conversion
 * to all supported grading systems.
 *
 * @example
 * ```ts
 * // Auto-detect and normalize
 * const grade = NormalizedGrade.fromString('7a+')
 * console.log(grade.detectedSystem) // 'french'
 * console.log(grade.toSystem('yds')) // '5.12a'
 *
 * // With known system
 * const ydsGrade = NormalizedGrade.fromString('5.12a', 'yds')
 * console.log(ydsGrade.toSystem('french')) // '7b'
 * ```
 */
export class NormalizedGrade {
  private constructor(
    private readonly original: string,
    private readonly detectedSystem: GradeSystem,
    private readonly index: number | null,
    private readonly category: GradeCategory | null,
    private readonly equivalents: GradeEquivalents,
  ) {}

  // ============ Conversion Methods ============

  /**
   * Get the grade in a specific system
   */
  toSystem(system: GradeSystem): string | null {
    return this.equivalents[system]
  }

  /**
   * Get the French equivalent (base system)
   */
  get french(): string | null {
    return this.equivalents.french
  }

  /**
   * Get the YDS equivalent
   */
  get yds(): string | null {
    return this.equivalents.yds
  }

  /**
   * Get the UIAA equivalent
   */
  get uiaa(): string | null {
    return this.equivalents.uiaa
  }

  /**
   * Get the British equivalent
   */
  get british(): string | null {
    return this.equivalents.british
  }

  /**
   * Get the Font equivalent (bouldering)
   */
  get font(): string | null {
    return this.equivalents.font
  }

  /**
   * Get the Hueco/V-scale equivalent (bouldering)
   */
  get hueco(): string | null {
    return this.equivalents.hueco
  }

  // ============ Display Methods ============

  /**
   * Get display string in user's preferred system
   */
  display(preferredSystem?: GradeSystem): string {
    if (!preferredSystem) {
      return this.original
    }
    return this.toSystem(preferredSystem) ?? this.original
  }

  /**
   * Get the grade category (easy/medium/hard/extreme)
   */
  getCategory(): GradeCategory | null {
    return this.category
  }

  /**
   * Get the difficulty level name
   */
  getDifficultyLevel(): string {
    if (!this.category) {
      return 'Unknown'
    }
    return GRADE_CATEGORY_LABELS[this.category]
  }

  /**
   * Get color hint for UI display
   */
  getColorHint(): string {
    if (!this.category) {
      return '#3396cc' // Default blue
    }
    return GRADE_CATEGORY_COLORS[this.category]
  }

  // ============ Comparison Methods ============

  /**
   * Compare grades. Returns:
   * - negative if this grade is easier
   * - 0 if grades are equal
   * - positive if this grade is harder
   */
  compareTo(other: NormalizedGrade): number {
    const thisIndex = this.index ?? 0
    const otherIndex = other.index ?? 0
    return thisIndex - otherIndex
  }

  /**
   * Check if this grade is harder than another
   */
  isHarderThan(other: NormalizedGrade): boolean {
    return this.compareTo(other) > 0
  }

  /**
   * Check if this grade is easier than another
   */
  isEasierThan(other: NormalizedGrade): boolean {
    return this.compareTo(other) < 0
  }

  /**
   * Check if this is considered a "hard" route (7a+ or above, index >= 31)
   */
  isHard(): boolean {
    return (this.index ?? 0) >= 31
  }

  /**
   * Check if this is considered a beginner route (easy category)
   */
  isBeginner(): boolean {
    return this.category === 'easy'
  }

  /**
   * Check if this is extreme level
   */
  isExtreme(): boolean {
    return this.category === 'extreme'
  }

  // ============ Factory Methods ============

  /**
   * Create a NormalizedGrade from a raw grade string
   * Auto-detects the grading system if not specified
   */
  static fromString(
    rawGrade: string,
    knownSystem?: GradeSystem,
  ): NormalizedGrade {
    const trimmed = rawGrade.trim()

    if (!trimmed) {
      return NormalizedGrade.unknown(rawGrade)
    }

    // Detect or use known system
    let system: GradeSystem
    let normalizedValue: string

    if (knownSystem) {
      system = knownSystem
      normalizedValue = trimmed
    } else {
      const detection = GradeSystemDetector.detect(trimmed)
      system = detection.system
      normalizedValue = detection.normalizedValue
    }

    // Convert to index
    const index = GradeConverter.toIndex(normalizedValue, system)

    // Calculate grade category using centralized function
    const category = index !== null ? getGradeCategory(index) : null

    // Get all equivalents
    const equivalents =
      index !== null
        ? GradeConverter.getEquivalentsFromIndex(index)
        : {
            french: null,
            yds: null,
            uiaa: null,
            british: null,
            font: null,
            hueco: null,
          }

    return new NormalizedGrade(rawGrade, system, index, category, equivalents)
  }

  /**
   * Create a NormalizedGrade from persisted data
   */
  static fromJSON(data: NormalizedGradeJSON): NormalizedGrade {
    return new NormalizedGrade(
      data.original,
      data.detectedSystem,
      data.index,
      data.gradeCategory,
      { ...data.equivalents },
    )
  }

  /**
   * Create a NormalizedGrade with pre-computed values
   * Use when loading from database
   */
  static create(data: {
    original: string
    detectedSystem?: GradeSystem
    index?: number | null
    gradeCategory?: GradeCategory | null
    equivalents?: Partial<GradeEquivalents>
  }): NormalizedGrade {
    // If we have index and system, compute everything
    if (data.index !== undefined && data.index !== null) {
      const category = data.gradeCategory ?? getGradeCategory(data.index)
      const equivalents = GradeConverter.getEquivalentsFromIndex(data.index)

      return new NormalizedGrade(
        data.original,
        data.detectedSystem ?? 'french',
        data.index,
        category,
        {
          ...equivalents,
          ...data.equivalents,
        },
      )
    }

    // Otherwise, try to parse from original
    return NormalizedGrade.fromString(data.original, data.detectedSystem)
  }

  /**
   * Create an unknown/invalid grade
   */
  static unknown(original: string): NormalizedGrade {
    return new NormalizedGrade(original, 'french', null, null, {
      french: null,
      yds: null,
      uiaa: null,
      british: null,
      font: null,
      hueco: null,
    })
  }

  // ============ Serialization ============

  /**
   * Convert to JSON for persistence
   */
  toJSON(): NormalizedGradeJSON {
    return {
      original: this.original,
      detectedSystem: this.detectedSystem,
      index: this.index,
      gradeCategory: this.category,
      equivalents: { ...this.equivalents },
    }
  }

  /**
   * Get simple string representation
   */
  toString(): string {
    return this.original
  }

  /**
   * Get display value for a specific system
   * Alias for display() method
   */
  valueOf(): string {
    return this.original
  }
}
