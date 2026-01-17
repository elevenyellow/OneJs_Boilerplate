import { BRITISH_TO_INDEX } from '../tables/british.table'
import { FONT_TO_INDEX } from '../tables/font.table'
import { FRENCH_TO_INDEX } from '../tables/french.table'
import { HUECO_TO_INDEX } from '../tables/hueco.table'
import { UIAA_TO_INDEX } from '../tables/uiaa.table'
import { YDS_TO_INDEX } from '../tables/yds.table'
import type { GradeSystem } from '../types/grade-systems.types'

/**
 * Detection patterns for each grading system
 */
const DETECTION_PATTERNS: Record<GradeSystem, RegExp> = {
  // YDS: 5.X or 5.XXa/b/c/d (must check before french to avoid conflicts)
  yds: /^5\.\d{1,2}[a-d]?$/i,

  // Hueco: VB, V0-V17 (must check before others due to unique V prefix)
  hueco: /^v[b0-9]$|^v1[0-7]$/i,

  // UIAA: Roman numerals with optional +/- (III to XII)
  uiaa: /^(iii|iv|v|vi|vii|viii|ix|x|xi|xii)[-+]?$/i,

  // British: M, D, VD, S, HS, VS, HVS, E1-E11
  british: /^(m|d|vd|hd|s|hs|vs|hvs|e[1-9]|e1[01])(\s*\d[abc])?$/i,

  // Font: Uses UPPERCASE letters - 6A, 7C+ (for bouldering)
  // Check if it has uppercase A/B/C to distinguish from french
  font: /^[3-8][ABC]\+?$/,

  // French: 3 to 9, with optional a/b/c and + (lowercase or will be normalized)
  // This is the fallback/default
  french: /^[3-9][abc]?\+?$/i,
}

/**
 * Priority order for detection (more specific patterns first)
 */
const DETECTION_ORDER: GradeSystem[] = [
  'yds', // Check 5.X pattern first
  'hueco', // Check V-scale next
  'uiaa', // Check roman numerals
  'british', // Check british grades
  'font', // Check Font (uppercase) before french
  'french', // Default fallback
]

export interface DetectionResult {
  system: GradeSystem
  confidence: 'exact' | 'pattern' | 'fallback'
  normalizedValue: string
}

/**
 * Service to detect the grading system from a grade string
 */
export class GradeSystemDetector {
  /**
   * Detect the grading system from a raw grade string
   */
  static detect(rawGrade: string): DetectionResult {
    const cleaned = rawGrade.trim()

    // First, try exact match in each table
    const exactMatch = GradeSystemDetector.findExactMatch(cleaned)
    if (exactMatch) {
      return {
        system: exactMatch.system,
        confidence: 'exact',
        normalizedValue: exactMatch.normalizedValue,
      }
    }

    // Try pattern matching in priority order
    for (const system of DETECTION_ORDER) {
      const pattern = DETECTION_PATTERNS[system]
      if (pattern.test(cleaned)) {
        return {
          system,
          confidence: 'pattern',
          normalizedValue: GradeSystemDetector.normalizeForSystem(
            cleaned,
            system,
          ),
        }
      }
    }

    // Fallback to french (most common in European climbing databases)
    return {
      system: 'french',
      confidence: 'fallback',
      normalizedValue: cleaned.toLowerCase(),
    }
  }

  /**
   * Try to find an exact match in any grade table
   */
  private static findExactMatch(
    grade: string,
  ): { system: GradeSystem; normalizedValue: string } | null {
    const lower = grade.toLowerCase()

    // Check French (lowercase)
    if (FRENCH_TO_INDEX.has(lower)) {
      return { system: 'french', normalizedValue: lower }
    }

    // Check YDS (lowercase)
    if (YDS_TO_INDEX.has(lower)) {
      return { system: 'yds', normalizedValue: grade }
    }

    // Check UIAA (lowercase for lookup, preserve case for display)
    if (UIAA_TO_INDEX.has(lower)) {
      return { system: 'uiaa', normalizedValue: grade.toUpperCase() }
    }

    // Check British (lowercase for lookup)
    if (BRITISH_TO_INDEX.has(lower)) {
      return { system: 'british', normalizedValue: grade.toUpperCase() }
    }

    // Check Font (case-sensitive - uppercase letters)
    if (FONT_TO_INDEX.has(grade)) {
      return { system: 'font', normalizedValue: grade }
    }

    // Check Hueco (lowercase for lookup)
    if (HUECO_TO_INDEX.has(lower)) {
      return { system: 'hueco', normalizedValue: grade.toUpperCase() }
    }

    return null
  }

  /**
   * Normalize the grade value for a specific system
   */
  private static normalizeForSystem(
    grade: string,
    system: GradeSystem,
  ): string {
    switch (system) {
      case 'french':
        return grade.toLowerCase()
      case 'yds':
        return grade.toLowerCase()
      case 'uiaa':
        return grade.toUpperCase()
      case 'british':
        return grade.toUpperCase()
      case 'font':
        // Font grades keep uppercase letters
        return grade.replace(/[abc]/g, (m) => m.toUpperCase())
      case 'hueco':
        return grade.toUpperCase()
      default:
        return grade
    }
  }

  /**
   * Check if a grade string is valid for a specific system
   */
  static isValidForSystem(grade: string, system: GradeSystem): boolean {
    const pattern = DETECTION_PATTERNS[system]
    return pattern.test(grade.trim())
  }
}
