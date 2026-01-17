/**
 * Grade utilities for the mobile app
 *
 * The API sends grades as gradeBand (numeric index 10-52).
 * Use GradeConverter.fromIndex() to convert to display strings.
 * This file provides UI utilities like category labels and filter ranges.
 */

import {
  GradeConverter,
  type GradeSystem as SharedGradeSystem,
} from '@climb-zone/grades'
import type { GradeCategory } from '@/types/api'
import { colors } from '@/theme/colors'

// Supported grade systems
export type GradeSystem =
  | 'french'
  | 'yds'
  | 'uiaa'
  | 'british'
  | 'font'
  | 'hueco'

// Grade category thresholds (same as backend)
// GradeBand range: 10-52 (based on packages/grades/domain/tables/)
// easy: 10-23 (3 to 5c+), medium: 24-29 (6a to 6c+), hard: 30-35 (7a to 7c+), extreme: 36-52 (8a to 9c/V17)
export const GRADE_CATEGORY_THRESHOLDS = {
  easy: { min: 10, max: 23 },
  medium: { min: 24, max: 29 },
  hard: { min: 30, max: 35 },
  extreme: { min: 36, max: 52 },
} as const

/**
 * Grade category colors - imported from the centralized color system
 * @see src/theme/colors.ts for the source of truth
 */
export const GRADE_CATEGORY_COLORS: Record<GradeCategory, string> = colors.grade

// Representative grade ranges by system for each category
// These are used for filter labels
// Exclude 'unknown' from grade ranges - it's a special case
export type FilterableGradeCategory = Exclude<GradeCategory, 'unknown'>

export const GRADE_RANGES: Record<
  GradeSystem,
  Record<FilterableGradeCategory, { min: string; max: string }>
> = {
  french: {
    easy: { min: '3', max: '5c+' },
    medium: { min: '6a', max: '6c+' },
    hard: { min: '7a', max: '7c+' },
    extreme: { min: '8a', max: '9c' },
  },
  yds: {
    easy: { min: '5.3', max: '5.9' },
    medium: { min: '5.10a', max: '5.11b' },
    hard: { min: '5.11c', max: '5.12d' },
    extreme: { min: '5.13a', max: '5.15d' },
  },
  uiaa: {
    easy: { min: 'III', max: 'VI' },
    medium: { min: 'VI+', max: 'VII+' },
    hard: { min: 'VIII-', max: 'IX' },
    extreme: { min: 'IX+', max: 'XII' },
  },
  british: {
    easy: { min: 'D', max: 'S' },
    medium: { min: 'HS', max: 'E2' },
    hard: { min: 'E3', max: 'E6' },
    extreme: { min: 'E7', max: 'E11' },
  },
  font: {
    easy: { min: '3', max: '5+' },
    medium: { min: '6A', max: '6C+' },
    hard: { min: '7A', max: '7C+' },
    extreme: { min: '8A', max: '9A' },
  },
  hueco: {
    easy: { min: 'VB', max: 'V2' },
    medium: { min: 'V3', max: 'V5' },
    hard: { min: 'V6', max: 'V9' },
    extreme: { min: '10', max: 'V17' },
  },
}

/**
 * Get grade range label for a category in the user's preferred system
 *
 * @example
 * getGradeRangeLabel('hard', 'french') // "7a - 7c+"
 * getGradeRangeLabel('hard', 'yds')    // "5.11c - 5.12d"
 */
export function getGradeRangeLabel(
  category: FilterableGradeCategory,
  system: GradeSystem = 'french',
): string {
  const range = GRADE_RANGES[system][category]
  return `${range.min} - ${range.max}`
}

/**
 * Get a compact grade range label (just the typical range)
 *
 * @example
 * getCompactGradeLabel('hard', 'french') // "7a-7c+"
 */
export function getCompactGradeLabel(
  category: FilterableGradeCategory,
  system: GradeSystem = 'french',
): string {
  const range = GRADE_RANGES[system][category]
  return `${range.min}-${range.max}`
}

/**
 * Get the minimum grade for a category in the user's system
 */
export function getMinGradeForCategory(
  category: FilterableGradeCategory,
  system: GradeSystem = 'french',
): string {
  return GRADE_RANGES[system][category].min
}

/**
 * Get the maximum grade for a category in the user's system
 */
export function getMaxGradeForCategory(
  category: FilterableGradeCategory,
  system: GradeSystem = 'french',
): string {
  return GRADE_RANGES[system][category].max
}

export type GradeFilterOption = {
  id: FilterableGradeCategory | 'all'
  label: string
  color?: string
}

/**
 * Translator function type for i18n integration
 */
export type GradeTranslator = (key: string) => string

/**
 * Build grade filter options for the user's preferred system
 *
 * @param system - The grade system to use for labels
 * @param t - Optional translator function for i18n. If not provided, uses 'All' as fallback.
 *
 * @example
 * // With i18n
 * const { t } = useTranslation()
 * buildGradeFilters('french', t)
 *
 * // Without i18n (fallback)
 * buildGradeFilters('french')
 */
export function buildGradeFilters(
  system: GradeSystem = 'french',
  t?: GradeTranslator,
): GradeFilterOption[] {
  const allLabel = t ? t('grades.all') : 'All'

  return [
    { id: 'all', label: allLabel },
    {
      id: 'easy',
      label: getCompactGradeLabel('easy', system),
      color: GRADE_CATEGORY_COLORS.easy,
    },
    {
      id: 'medium',
      label: getCompactGradeLabel('medium', system),
      color: GRADE_CATEGORY_COLORS.medium,
    },
    {
      id: 'hard',
      label: getCompactGradeLabel('hard', system),
      color: GRADE_CATEGORY_COLORS.hard,
    },
    {
      id: 'extreme',
      label: `${getMinGradeForCategory('extreme', system)}+`,
      color: GRADE_CATEGORY_COLORS.extreme,
    },
  ]
}

/**
 * Get the display name for a grade system
 *
 * @param system - The grade system
 * @param t - Optional translator function for i18n. If not provided, uses English fallback.
 */
export function getGradeSystemDisplayName(
  system: GradeSystem,
  t?: GradeTranslator,
): string {
  if (t) {
    return t(`grades.systems.${system}`)
  }

  // English fallback when translator not provided
  const names: Record<GradeSystem, string> = {
    french: 'French',
    yds: 'YDS (USA)',
    uiaa: 'UIAA',
    british: 'British',
    font: 'Font (Boulder)',
    hueco: 'V-Scale (Boulder)',
  }
  return names[system]
}

/**
 * Get all available grade systems for user selection
 *
 * @param t - Optional translator function for i18n. If not provided, uses English fallback.
 */
export function getAvailableGradeSystems(t?: GradeTranslator): Array<{
  id: GradeSystem
  name: string
}> {
  if (t) {
    return [
      { id: 'french', name: t('grades.systemsLong.french') },
      { id: 'yds', name: t('grades.systemsLong.yds') },
      { id: 'uiaa', name: t('grades.systemsLong.uiaa') },
      { id: 'british', name: t('grades.systemsLong.british') },
      { id: 'font', name: t('grades.systemsLong.font') },
      { id: 'hueco', name: t('grades.systemsLong.hueco') },
    ]
  }

  // English fallback when translator not provided
  return [
    { id: 'french', name: 'French (6a, 7b+, 8c)' },
    { id: 'yds', name: 'YDS (5.10a, 5.12d)' },
    { id: 'uiaa', name: 'UIAA (VI, VII+, IX)' },
    { id: 'british', name: 'British (E1, E5, HVS)' },
    { id: 'font', name: 'Font Boulder (6A, 7C+)' },
    { id: 'hueco', name: 'V-Scale Boulder (V0, V5)' },
  ]
}

/**
 * Format a grade range from gradeBand min/max to display string
 *
 * @param minGradeBand - Minimum gradeBand index (10-52) or null
 * @param maxGradeBand - Maximum gradeBand index (10-52) or null
 * @param system - User's preferred grade system
 * @returns Grade range string like "6a - 7b+" or null if no grades
 *
 * @example
 * formatGradeRangeFromBands(24, 30, 'french') // "6a - 7a"
 * formatGradeRangeFromBands(24, 24, 'french') // "6a"
 * formatGradeRangeFromBands(null, null, 'french') // null
 */
export function formatGradeRangeFromBands(
  minGradeBand: number | null | undefined,
  maxGradeBand: number | null | undefined,
  system: GradeSystem = 'french',
): string | null {
  if (minGradeBand == null || maxGradeBand == null) {
    return null
  }

  const minLabel = GradeConverter.fromIndex(
    minGradeBand,
    system as SharedGradeSystem,
  )
  const maxLabel = GradeConverter.fromIndex(
    maxGradeBand,
    system as SharedGradeSystem,
  )

  if (!minLabel || !maxLabel) {
    return null
  }

  if (minGradeBand === maxGradeBand) {
    return minLabel
  }

  return `${minLabel} - ${maxLabel}`
}

/**
 * Convert a single gradeBand to display string
 *
 * @param gradeBand - GradeBand index (10-52) or null
 * @param system - User's preferred grade system
 * @returns Grade string like "6a" or "?" if invalid/null
 */
export function formatGradeFromBand(
  gradeBand: number | null | undefined,
  system: GradeSystem = 'french',
): string {
  if (gradeBand == null || gradeBand === 0) {
    return '?'
  }

  return GradeConverter.fromIndex(gradeBand, system as SharedGradeSystem) ?? '?'
}
