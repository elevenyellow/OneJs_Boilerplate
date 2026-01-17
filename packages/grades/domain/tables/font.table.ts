/**
 * Fontainebleau (Font) grading system table
 * Used for bouldering, primarily in Europe
 * Uses uppercase letters (6A, 7C+) to distinguish from French sport grades
 */

import type { GradeTableEntry } from './french.table'

/**
 * Font grades mapped to universal index
 */
export const FONT_TABLE: GradeTableEntry[] = [
  { grade: '3', index: 10 },
  { grade: '3+', index: 11 },
  { grade: '4', index: 12 },
  { grade: '4+', index: 14 },
  { grade: '5', index: 16 },
  { grade: '5+', index: 18 },
  { grade: '6A', index: 20 },
  { grade: '6A+', index: 21 },
  { grade: '6B', index: 22 },
  { grade: '6B+', index: 24 },
  { grade: '6C', index: 26 },
  { grade: '6C+', index: 28 },
  { grade: '7A', index: 30 },
  { grade: '7A+', index: 32 },
  { grade: '7B', index: 34 },
  { grade: '7B+', index: 36 },
  { grade: '7C', index: 38 },
  { grade: '7C+', index: 40 },
  { grade: '8A', index: 42 },
  { grade: '8A+', index: 44 },
  { grade: '8B', index: 46 },
  { grade: '8B+', index: 48 },
  { grade: '8C', index: 50 },
  { grade: '8C+', index: 52 },
]

/**
 * Map from grade string to index
 * Font grades are case-sensitive (uppercase letters)
 */
export const FONT_TO_INDEX: Map<string, number> = new Map(
  FONT_TABLE.map((e) => [e.grade, e.index]),
)

/**
 * Map from index to grade string
 */
export const INDEX_TO_FONT: Map<number, string> = new Map(
  FONT_TABLE.map((e) => [e.index, e.grade]),
)
