/**
 * useUserPerformance Hook
 *
 * Fetches user ascents and transforms them into performance data grouped by month.
 * Provides statistics, grade distribution, and recent activities for each month.
 */

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getUserAscents } from '@/services/api/ascents'
import type { GetUserAscentsResponse } from '@/services/api/ascents'
import type { GradeSystem } from '@/utils/grades'
import {
  routeGradeBandToGradeString,
  calculateGradeDistribution,
  formatActivities,
  gradeBandToCategoryAndColor,
} from '@/utils/performanceTransformers'
import type {
  PerformanceDataByMonth,
  MonthPerformanceData,
  MonthlyStats,
} from '@/components/performance/types'
import { colors } from '@/theme/colors'
import { usePreferences } from '@/contexts/PreferencesContext'

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Gets month key in format "YYYY-MM"
 */
function getMonthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

/**
 * Gets month key from a date
 */
function getMonthKeyFromDate(date: Date): string {
  return getMonthKey(date.getFullYear(), date.getMonth())
}

/**
 * Groups ascents by month
 */
function groupAscentsByMonth(
  ascents: GetUserAscentsResponse['ascents'],
): Record<string, GetUserAscentsResponse['ascents']> {
  const grouped: Record<string, GetUserAscentsResponse['ascents']> = {}

  for (const ascent of ascents) {
    const date = new Date(ascent.ascentDate)
    const monthKey = getMonthKeyFromDate(date)

    if (!grouped[monthKey]) {
      grouped[monthKey] = []
    }

    grouped[monthKey].push(ascent)
  }

  return grouped
}

/**
 * Gets unique days count from ascents in a month
 */
function getUniqueDays(ascents: GetUserAscentsResponse['ascents']): number {
  const uniqueDays = new Set<string>()

  for (const ascent of ascents) {
    const date = new Date(ascent.ascentDate)
    const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    uniqueDays.add(dayKey)
  }

  return uniqueDays.size
}

/**
 * Finds the maximum grade in a set of ascents
 */
function getMaxGrade(
  ascents: GetUserAscentsResponse['ascents'],
  system: GradeSystem,
): { grade: string; color: string } {
  if (ascents.length === 0) {
    return { grade: '?', color: colors.grade.unknown }
  }

  // Find the highest route gradeBand (10-52)
  let maxGradeBand = 0
  for (const ascent of ascents) {
    if (ascent.route.gradeBand > maxGradeBand) {
      maxGradeBand = ascent.route.gradeBand
    }
  }

  if (maxGradeBand === 0) {
    return { grade: '?', color: colors.grade.unknown }
  }

  const gradeString = routeGradeBandToGradeString(maxGradeBand, system)
  const { color } = gradeBandToCategoryAndColor(
    ascentGradeBandFromRouteGradeBand(maxGradeBand),
  )

  return { grade: gradeString, color }
}

/**
 * Converts route gradeBand (10-52) to ascent gradeBand (1-5)
 */
function ascentGradeBandFromRouteGradeBand(
  routeGradeBand: number,
): number {
  if (routeGradeBand >= 10 && routeGradeBand <= 17) return 1
  if (routeGradeBand >= 18 && routeGradeBand <= 28) return 2
  if (routeGradeBand >= 29 && routeGradeBand <= 37) return 3
  if (routeGradeBand >= 38 && routeGradeBand <= 45) return 4
  if (routeGradeBand >= 46 && routeGradeBand <= 52) return 5
  return 1
}

/**
 * Calculates comparison percentage between two months
 */
function calculateComparison(
  currentCount: number,
  previousCount: number,
): number {
  if (previousCount === 0) {
    return currentCount > 0 ? 100 : 0
  }

  return Math.round(((currentCount - previousCount) / previousCount) * 100)
}

/**
 * Gets previous month key
 */
function getPreviousMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  let prevYear = year
  let prevMonth = month - 1

  if (prevMonth === 0) {
    prevMonth = 12
    prevYear = year - 1
  }

  return `${prevYear}-${String(prevMonth).padStart(2, '0')}`
}

/**
 * Calculates monthly stats for a set of ascents
 */
function calculateMonthlyStats(
  ascents: GetUserAscentsResponse['ascents'],
  monthKey: string,
  allGrouped: Record<string, GetUserAscentsResponse['ascents']>,
  system: GradeSystem,
): MonthlyStats {
  const totalRoutes = ascents.length
  const daysOutdoor = getUniqueDays(ascents)
  const { grade: maxGrade, color: maxGradeColor } = getMaxGrade(
    ascents,
    system,
  )

  // Calculate comparison with previous month
  const previousMonthKey = getPreviousMonthKey(monthKey)
  const previousAscents = allGrouped[previousMonthKey] ?? []
  const previousCount = previousAscents.length
  const comparisonPercentage = calculateComparison(totalRoutes, previousCount)

  return {
    totalRoutes,
    maxGrade,
    maxGradeColor,
    daysOutdoor,
    comparisonPercentage,
    comparisonMonthKey: previousMonthKey,
  }
}

/**
 * Transforms grouped ascents into performance data by month
 */
function transformToPerformanceData(
  grouped: Record<string, GetUserAscentsResponse['ascents']>,
  system: GradeSystem,
): PerformanceDataByMonth {
  const result: PerformanceDataByMonth = {}

  for (const [monthKey, ascents] of Object.entries(grouped)) {
    if (ascents.length === 0) continue

    const stats = calculateMonthlyStats(ascents, monthKey, grouped, system)
    const distribution = calculateGradeDistribution(ascents, system)
    const activities = formatActivities(ascents, system, 5)

    result[monthKey] = {
      stats,
      distribution,
      activities,
    }
  }

  return result
}

// =============================================================================
// Hook
// =============================================================================

export interface UseUserPerformanceResult {
  data: PerformanceDataByMonth | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
  getMonthData: (monthKey: string) => MonthPerformanceData | undefined
}

export function useUserPerformance(): UseUserPerformanceResult {
  const { preferences } = usePreferences()
  const gradeSystem = (preferences.gradeSystem || 'french') as GradeSystem

  const {
    data: ascentsResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['user-ascents'],
    queryFn: getUserAscents,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const performanceData = useMemo(() => {
    if (!ascentsResponse?.ascents) {
      return undefined
    }

    const grouped = groupAscentsByMonth(ascentsResponse.ascents)
    return transformToPerformanceData(grouped, gradeSystem)
  }, [ascentsResponse, gradeSystem])

  const getMonthData = useMemo(
    () => (monthKey: string) => {
      return performanceData?.[monthKey]
    },
    [performanceData],
  )

  return {
    data: performanceData,
    isLoading,
    isError,
    error: error as Error | null,
    refetch: () => {
      refetch()
    },
    getMonthData,
  }
}
