/**
 * British grading system table
 * Uses adjectival grade (E1, E2, etc.) + technical grade (5a, 5b, etc.)
 * For simplicity, we use the adjectival grade as the main reference
 */

import type { GradeTableEntry } from './french.table'

/**
 * British grades mapped to universal index
 * Simplified to main E-grades for route comparison
 */
export const BRITISH_TABLE: GradeTableEntry[] = [
  { grade: 'M', index: 10 },
  { grade: 'D', index: 12 },
  { grade: 'VD', index: 14 },
  { grade: 'S', index: 16 },
  { grade: 'HS', index: 18 },
  { grade: 'VS', index: 20 },
  { grade: 'HVS', index: 24 },
  { grade: 'E1', index: 26 },
  { grade: 'E2', index: 28 },
  { grade: 'E3', index: 30 },
  { grade: 'E4', index: 32 },
  { grade: 'E5', index: 34 },
  { grade: 'E6', index: 36 },
  { grade: 'E7', index: 38 },
  { grade: 'E8', index: 40 },
  { grade: 'E9', index: 42 },
  { grade: 'E10', index: 44 },
  { grade: 'E11', index: 46 },
]

/**
 * Map from grade string to index (case insensitive)
 */
export const BRITISH_TO_INDEX: Map<string, number> = new Map(
  BRITISH_TABLE.map((e) => [e.grade.toLowerCase(), e.index]),
)

/**
 * Map from index to grade string
 */
export const INDEX_TO_BRITISH: Map<number, string> = new Map(
  BRITISH_TABLE.map((e) => [e.index, e.grade]),
)
