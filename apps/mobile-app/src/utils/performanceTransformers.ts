/**
 * Performance Data Transformers
 *
 * Functions to transform API data (ascents) into the format expected by
 * the Performance screen components.
 */

import { GradeConverter, type GradeSystem as SharedGradeSystem } from '@climb-zone/grades'
import type { GradeSystem } from './grades'
import { colors } from '@/theme/colors'
import type { GradeBand } from '@/theme/colors'
import type { GetUserAscentsResponse } from '@/services/api/ascents'
import type {
  MonthlyStats,
  GradeDistributionItem,
  ClimbActivity,
  ClimbStyle,
} from '@/components/performance/types'
import { GRADE_CATEGORY_THRESHOLDS } from './grades'

// =============================================================================
// Grade Band to Category Mapping
// =============================================================================

/**
 * Maps gradeBand (1-5) to grade category
 * Note: gradeBand 1-5 corresponds to universal indices:
 * - 1: 10-17 (easy)
 * - 2: 18-28 (medium)
 * - 3: 29-37 (hard)
 * - 4: 38-45 (extreme)
 * - 5: 46-52 (extreme)
 */
function gradeBandToCategory(gradeBand: number): GradeBand {
  if (gradeBand === 1) return 'easy'
  if (gradeBand === 2) return 'medium'
  if (gradeBand === 3) return 'hard'
  if (gradeBand === 4 || gradeBand === 5) return 'extreme'
  return 'unknown'
}

/**
 * Converts gradeBand (1-5) to universal index range for conversion
 * gradeBand 1 = indices 10-17, gradeBand 2 = 18-28, etc.
 */
function gradeBandToUniversalIndex(gradeBand: number): number {
  // Map gradeBand to middle of range for display
  const mapping: Record<number, number> = {
    1: 17, // middle of 10-17
    2: 24, // middle of 18-28
    3: 33, // middle of 29-37
    4: 42, // middle of 38-45
    5: 49, // middle of 46-52
  }
  return mapping[gradeBand] ?? 17
}

/**
 * Converts route gradeBand (10-52) to grade string
 */
export function routeGradeBandToGradeString(
  gradeBand: number,
  system: GradeSystem = 'french',
): string {
  if (!gradeBand || gradeBand < 10 || gradeBand > 52) {
    return '?'
  }
  return (
    GradeConverter.fromIndex(gradeBand, system as SharedGradeSystem) ?? '?'
  )
}

/**
 * Converts ascent gradeBand (1-5) to grade string
 * Uses the middle of the range for the gradeBand
 */
export function ascentGradeBandToGradeString(
  gradeBand: number,
  system: GradeSystem = 'french',
): string {
  const universalIndex = gradeBandToUniversalIndex(gradeBand)
  return routeGradeBandToGradeString(universalIndex, system)
}

/**
 * Maps ascent style number (0-4) to climb style string
 * Note: This is a simplification - we don't have route type info in ascents
 * For now, we'll default to 'Sport' as it's the most common
 */
export function styleNumberToStyleString(_style: number): ClimbStyle {
  // TODO: If route type information becomes available, use it to determine
  // Sport vs Trad vs Boulder. For now, default to Sport.
  return 'Sport'
}

/**
 * Maps gradeBand to category and returns color
 */
export function gradeBandToCategoryAndColor(gradeBand: number): {
  category: GradeBand
  color: string
} {
  const category = gradeBandToCategory(gradeBand)
  return {
    category,
    color: colors.grade[category],
  }
}

// =============================================================================
// Date Formatting
// =============================================================================

/**
 * Formats date label for activity list
 * Returns translation key or formatted date string
 */
export function formatDateLabel(
  date: Date,
  now: Date = new Date(),
): string {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const activityDate = new Date(date)
  activityDate.setHours(0, 0, 0, 0)

  const diffTime = today.getTime() - activityDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return 'performance.activity.today'
  }

  if (diffDays === 1) {
    return 'performance.activity.yesterday'
  }

  // Format as "DD MMM" (e.g., "12 ENE")
  const day = activityDate.getDate()
  const monthNames = [
    'ENE',
    'FEB',
    'MAR',
    'ABR',
    'MAY',
    'JUN',
    'JUL',
    'AGO',
    'SEP',
    'OCT',
    'NOV',
    'DIC',
  ]
  const month = monthNames[activityDate.getMonth()]

  return `${day} ${month}`
}

// =============================================================================
// Grade Distribution
// =============================================================================

/**
 * Calculates grade distribution for a set of ascents
 */
export function calculateGradeDistribution(
  ascents: GetUserAscentsResponse['ascents'],
  system: GradeSystem = 'french',
): GradeDistributionItem[] {
  const counts: Record<GradeBand, number> = {
    easy: 0,
    medium: 0,
    hard: 0,
    extreme: 0,
    unknown: 0,
  }

  // Count ascents by category
  for (const ascent of ascents) {
    const category = gradeBandToCategory(ascent.gradeBand)
    counts[category]++
  }

  // Build distribution items with labels
  const ranges = {
    french: {
      easy: '3-5c+',
      medium: '6a-6c+',
      hard: '7a-7c+',
      extreme: '8a+',
    },
    yds: {
      easy: '5.3-5.9',
      medium: '5.10a-5.11b',
      hard: '5.11c-5.12d',
      extreme: '5.13a+',
    },
    uiaa: {
      easy: 'III-VI',
      medium: 'VI+-VII+',
      hard: 'VIII--IX',
      extreme: 'IX++',
    },
    british: {
      easy: 'D-S',
      medium: 'HS-E2',
      hard: 'E3-E6',
      extreme: 'E7+',
    },
    font: {
      easy: '3-5+',
      medium: '6A-6C+',
      hard: '7A-7C+',
      extreme: '8A+',
    },
    hueco: {
      easy: 'VB-V2',
      medium: 'V3-V5',
      hard: 'V6-V9',
      extreme: '10+',
    },
  }

  const labels = ranges[system] ?? ranges.french

  return [
    {
      band: 'easy',
      label: labels.easy,
      count: counts.easy,
      color: colors.grade.easy,
    },
    {
      band: 'medium',
      label: labels.medium,
      count: counts.medium,
      color: colors.grade.medium,
    },
    {
      band: 'hard',
      label: labels.hard,
      count: counts.hard,
      color: colors.grade.hard,
    },
    {
      band: 'extreme',
      label: labels.extreme,
      count: counts.extreme,
      color: colors.grade.extreme,
    },
  ]
}

// =============================================================================
// Activity Formatting
// =============================================================================

/**
 * Formats ascents as activity items for display
 */
export function formatActivities(
  ascents: GetUserAscentsResponse['ascents'],
  system: GradeSystem = 'french',
  limit: number = 5,
): ClimbActivity[] {
  // Sort by date descending and take most recent
  const sorted = [...ascents]
    .sort((a, b) => {
      const dateA = new Date(a.ascentDate).getTime()
      const dateB = new Date(b.ascentDate).getTime()
      return dateB - dateA
    })
    .slice(0, limit)

  const now = new Date()

  return sorted.map((ascent) => {
    const date = new Date(ascent.ascentDate)
    const gradeString = routeGradeBandToGradeString(
      ascent.route.gradeBand,
      system,
    )
    const { category, color } = gradeBandToCategoryAndColor(ascent.gradeBand)
    const style = styleNumberToStyleString(ascent.style)

    return {
      id: ascent.id,
      routeName: ascent.route.name,
      grade: gradeString,
      gradeColor: color,
      style,
      cragName: ascent.crag.name,
      stars: ascent.route.stars ?? 0,
      dateLabel: formatDateLabel(date, now),
    }
  })
}
