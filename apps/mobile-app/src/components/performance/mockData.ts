import { colors } from '@/theme/colors'
import type { PerformanceDataByMonth, SyncInfo } from './types'

// =============================================================================
// Helpers
// =============================================================================

export const getMonthKey = (year: number, month: number): string =>
  `${year}-${String(month + 1).padStart(2, '0')}`

// =============================================================================
// Mock Data - Current month is January 2026
// Grade category thresholds (based on French grades):
// - easy: 3 to 5c+ (index 10-23)
// - medium: 6a to 6c+ (index 24-29)
// - hard: 7a to 7c+ (index 30-35)
// - extreme: 8a and above (index 36+)
// =============================================================================

export const mockPerformanceData: PerformanceDataByMonth = {
  // January 2026 (current month)
  '2026-01': {
    stats: {
      totalRoutes: 18,
      maxGrade: '7a',
      maxGradeColor: colors.grade.hard,
      daysOutdoor: 5,
      comparisonPercentage: -15,
      comparisonMonthKey: '2025-12',
    },
    distribution: [
      { band: 'easy', label: '3-5c+', count: 8, color: colors.grade.easy },
      { band: 'medium', label: '6a-6c+', count: 7, color: colors.grade.medium },
      { band: 'hard', label: '7a-7c+', count: 3, color: colors.grade.hard },
      { band: 'extreme', label: '8a+', count: 0, color: colors.grade.extreme },
    ],
    activities: [
      {
        id: '1',
        routeName: 'Placa del Sol',
        grade: '6c+',
        gradeColor: colors.grade.medium,
        style: 'Sport',
        cragName: 'Patones',
        stars: 3,
        dateLabel: 'performance.activity.today',
      },
      {
        id: '2',
        routeName: 'Diedro Central',
        grade: '6b',
        gradeColor: colors.grade.medium,
        style: 'Trad',
        cragName: 'La Pedriza',
        stars: 2,
        dateLabel: 'performance.activity.yesterday',
      },
      {
        id: '3',
        routeName: 'El Vuelo del Halcón',
        grade: '7a',
        gradeColor: colors.grade.hard,
        style: 'Sport',
        cragName: 'Chulilla',
        stars: 3,
        dateLabel: '12 ENE',
      },
    ],
  },
  // December 2025
  '2025-12': {
    stats: {
      totalRoutes: 21,
      maxGrade: '7a+',
      maxGradeColor: colors.grade.hard,
      daysOutdoor: 7,
      comparisonPercentage: 5,
      comparisonMonthKey: '2025-11',
    },
    distribution: [
      { band: 'easy', label: '3-5c+', count: 10, color: colors.grade.easy },
      { band: 'medium', label: '6a-6c+', count: 8, color: colors.grade.medium },
      { band: 'hard', label: '7a-7c+', count: 3, color: colors.grade.hard },
      { band: 'extreme', label: '8a+', count: 0, color: colors.grade.extreme },
    ],
    activities: [
      {
        id: '4',
        routeName: 'Fisura Clásica',
        grade: '6c',
        gradeColor: colors.grade.medium,
        style: 'Trad',
        cragName: 'El Chorro',
        stars: 3,
        dateLabel: '28 DIC',
      },
      {
        id: '5',
        routeName: 'Desplome Rojo',
        grade: '7a+',
        gradeColor: colors.grade.hard,
        style: 'Sport',
        cragName: 'Rodellar',
        stars: 3,
        dateLabel: '20 DIC',
      },
      {
        id: '6',
        routeName: 'Placa Negra',
        grade: '6b+',
        gradeColor: colors.grade.medium,
        style: 'Sport',
        cragName: 'Patones',
        stars: 2,
        dateLabel: '15 DIC',
      },
    ],
  },
  // November 2025
  '2025-11': {
    stats: {
      totalRoutes: 20,
      maxGrade: '7b',
      maxGradeColor: colors.grade.hard,
      daysOutdoor: 6,
      comparisonPercentage: 33,
      comparisonMonthKey: '2025-10',
    },
    distribution: [
      { band: 'easy', label: '3-5c+', count: 7, color: colors.grade.easy },
      { band: 'medium', label: '6a-6c+', count: 9, color: colors.grade.medium },
      { band: 'hard', label: '7a-7c+', count: 4, color: colors.grade.hard },
      { band: 'extreme', label: '8a+', count: 0, color: colors.grade.extreme },
    ],
    activities: [
      {
        id: '7',
        routeName: 'Espolón Norte',
        grade: '7b',
        gradeColor: colors.grade.hard,
        style: 'Sport',
        cragName: 'Siurana',
        stars: 3,
        dateLabel: '25 NOV',
      },
      {
        id: '8',
        routeName: 'La Rambla',
        grade: '6c+',
        gradeColor: colors.grade.medium,
        style: 'Sport',
        cragName: 'Siurana',
        stars: 3,
        dateLabel: '24 NOV',
      },
    ],
  },
  // October 2025
  '2025-10': {
    stats: {
      totalRoutes: 15,
      maxGrade: '6c+',
      maxGradeColor: colors.grade.medium,
      daysOutdoor: 4,
      comparisonPercentage: -10,
      comparisonMonthKey: '2025-09',
    },
    distribution: [
      { band: 'easy', label: '3-5c+', count: 8, color: colors.grade.easy },
      { band: 'medium', label: '6a-6c+', count: 6, color: colors.grade.medium },
      { band: 'hard', label: '7a-7c+', count: 1, color: colors.grade.hard },
      { band: 'extreme', label: '8a+', count: 0, color: colors.grade.extreme },
    ],
    activities: [
      {
        id: '9',
        routeName: 'Travesía del Rey',
        grade: '6c+',
        gradeColor: colors.grade.medium,
        style: 'Sport',
        cragName: 'El Chorro',
        stars: 3,
        dateLabel: '18 OCT',
      },
    ],
  },
  // September 2025
  '2025-09': {
    stats: {
      totalRoutes: 17,
      maxGrade: '7a',
      maxGradeColor: colors.grade.hard,
      daysOutdoor: 5,
      comparisonPercentage: 21,
      comparisonMonthKey: '2025-08',
    },
    distribution: [
      { band: 'easy', label: '3-5c+', count: 6, color: colors.grade.easy },
      { band: 'medium', label: '6a-6c+', count: 8, color: colors.grade.medium },
      { band: 'hard', label: '7a-7c+', count: 3, color: colors.grade.hard },
      { band: 'extreme', label: '8a+', count: 0, color: colors.grade.extreme },
    ],
    activities: [
      {
        id: '10',
        routeName: 'Pared de los Sueños',
        grade: '7a',
        gradeColor: colors.grade.hard,
        style: 'Sport',
        cragName: 'Margalef',
        stars: 3,
        dateLabel: '28 SEP',
      },
      {
        id: '11',
        routeName: 'Grieta del Tiempo',
        grade: '6b',
        gradeColor: colors.grade.medium,
        style: 'Trad',
        cragName: 'La Pedriza',
        stars: 2,
        dateLabel: '15 SEP',
      },
    ],
  },
  // August 2025
  '2025-08': {
    stats: {
      totalRoutes: 14,
      maxGrade: '6c',
      maxGradeColor: colors.grade.medium,
      daysOutdoor: 4,
      comparisonPercentage: -20,
      comparisonMonthKey: '2025-07',
    },
    distribution: [
      { band: 'easy', label: '3-5c+', count: 8, color: colors.grade.easy },
      { band: 'medium', label: '6a-6c+', count: 5, color: colors.grade.medium },
      { band: 'hard', label: '7a-7c+', count: 1, color: colors.grade.hard },
      { band: 'extreme', label: '8a+', count: 0, color: colors.grade.extreme },
    ],
    activities: [
      {
        id: '12',
        routeName: 'Via del Sol',
        grade: '6c',
        gradeColor: colors.grade.medium,
        style: 'Sport',
        cragName: 'Albarracín',
        stars: 2,
        dateLabel: '20 AGO',
      },
    ],
  },
}

export const mockSyncInfo: SyncInfo = {
  source: 'TheCrag',
  lastSyncLabel: 'performance.sync.minutesAgo',
  lastSyncValue: 2,
}
