/**
 * useGradeSystem Hook
 *
 * Provides grade system utilities based on user preferences.
 * Use this hook to get grade labels, filters, and conversions
 * in the user's preferred grade system.
 */

import { useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useGradeSystemPreference } from '@/contexts/PreferencesContext'
import {
  getGradeRangeLabel,
  getCompactGradeLabel,
  buildGradeFilters,
  getGradeSystemDisplayName,
  getAvailableGradeSystems,
  GRADE_CATEGORY_COLORS,
  type GradeSystem,
  type FilterableGradeCategory,
  type GradeFilterOption,
} from '@/utils/grades'

interface UseGradeSystemResult {
  /**
   * Current preferred grade system
   */
  gradeSystem: GradeSystem

  /**
   * Whether to show boulder grades
   */
  showBoulderGrades: boolean

  /**
   * Whether to show aid grades
   */
  showAidGrades: boolean

  /**
   * Update the grade system preference
   */
  setGradeSystem: (system: GradeSystem) => Promise<void>

  /**
   * Display name for current system (e.g., "French", "YDS (USA)")
   */
  gradeSystemDisplayName: string

  /**
   * Get grade range label for a category
   * @example getGradeRange('hard') => "7a - 7c+" or "5.11c - 5.12d"
   */
  getGradeRange: (category: FilterableGradeCategory) => string

  /**
   * Get compact grade label for a category
   * @example getCompactGrade('hard') => "7a-7c+" or "5.11c-5.12d"
   */
  getCompactGrade: (category: FilterableGradeCategory) => string

  /**
   * Build grade filter options for UI
   */
  gradeFilters: GradeFilterOption[]

  /**
   * All available grade systems for selection
   */
  availableSystems: Array<{ id: GradeSystem; name: string }>

  /**
   * Grade category colors
   */
  categoryColors: typeof GRADE_CATEGORY_COLORS
}

export function useGradeSystem(): UseGradeSystemResult {
  const { t } = useTranslation()
  const { gradeSystem, setGradeSystem, showBoulderGrades, showAidGrades } =
    useGradeSystemPreference()

  const gradeSystemDisplayName = useMemo(
    () => getGradeSystemDisplayName(gradeSystem, t),
    [gradeSystem, t],
  )

  const getGradeRange = useCallback(
    (category: FilterableGradeCategory) =>
      getGradeRangeLabel(category, gradeSystem),
    [gradeSystem],
  )

  const getCompactGrade = useCallback(
    (category: FilterableGradeCategory) =>
      getCompactGradeLabel(category, gradeSystem),
    [gradeSystem],
  )

  const gradeFilters = useMemo(
    () => buildGradeFilters(gradeSystem, t),
    [gradeSystem, t],
  )

  const availableSystems = useMemo(() => getAvailableGradeSystems(t), [t])

  return {
    gradeSystem,
    showBoulderGrades,
    showAidGrades,
    setGradeSystem,
    gradeSystemDisplayName,
    getGradeRange,
    getCompactGrade,
    gradeFilters,
    availableSystems,
    categoryColors: GRADE_CATEGORY_COLORS,
  }
}
