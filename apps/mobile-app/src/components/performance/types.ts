import type { GradeBand } from '@/theme/colors'

// =============================================================================
// Month Selection
// =============================================================================

export interface SelectedMonth {
  month: number // 0-11
  year: number
}

// =============================================================================
// Stats Section
// =============================================================================

export interface MonthlyStats {
  totalRoutes: number
  maxGrade: string
  maxGradeColor: string
  daysOutdoor: number
  comparisonPercentage: number
  comparisonMonthKey: string // Format: "YYYY-MM"
}

// =============================================================================
// Distribution Section
// =============================================================================

export interface GradeDistributionItem {
  band: GradeBand
  label: string
  count: number
  color: string
}

// =============================================================================
// Activity Section
// =============================================================================

export type ClimbStyle = 'Sport' | 'Trad' | 'Boulder'

export interface ClimbActivity {
  id: string
  routeName: string
  grade: string
  gradeColor: string
  style: ClimbStyle
  cragName: string
  stars: number
  dateLabel: string // Can be translation key or static text
}

// =============================================================================
// Sync Info
// =============================================================================

export interface SyncInfo {
  source: string
  lastSyncLabel: string // Translation key
  lastSyncValue?: number // For interpolation (e.g., minutes ago)
}

// =============================================================================
// Combined Data
// =============================================================================

export interface MonthPerformanceData {
  stats: MonthlyStats
  distribution: GradeDistributionItem[]
  activities: ClimbActivity[]
}

export type PerformanceDataByMonth = Record<string, MonthPerformanceData>
