/**
 * UIAA grading system table
 * Used primarily in Germany, Austria, Switzerland
 */

import type { GradeTableEntry } from './french.table'

/**
 * UIAA grades mapped to universal index
 */
export const UIAA_TABLE: GradeTableEntry[] = [
  { grade: 'III', index: 10 },
  { grade: 'III+', index: 11 },
  { grade: 'IV-', index: 12 },
  { grade: 'IV', index: 14 },
  { grade: 'IV+', index: 16 },
  { grade: 'V-', index: 17 },
  { grade: 'V', index: 18 },
  { grade: 'V+', index: 20 },
  { grade: 'VI-', index: 21 },
  { grade: 'VI', index: 22 },
  { grade: 'VI+', index: 24 },
  { grade: 'VII-', index: 25 },
  { grade: 'VII', index: 26 },
  { grade: 'VII+', index: 28 },
  { grade: 'VIII-', index: 29 },
  { grade: 'VIII', index: 30 },
  { grade: 'VIII+', index: 32 },
  { grade: 'IX-', index: 33 },
  { grade: 'IX', index: 34 },
  { grade: 'IX+', index: 36 },
  { grade: 'X-', index: 37 },
  { grade: 'X', index: 38 },
  { grade: 'X+', index: 40 },
  { grade: 'XI-', index: 41 },
  { grade: 'XI', index: 42 },
  { grade: 'XI+', index: 44 },
  { grade: 'XII-', index: 45 },
  { grade: 'XII', index: 46 },
]

/**
 * Map from grade string to index (case insensitive)
 */
export const UIAA_TO_INDEX: Map<string, number> = new Map(
  UIAA_TABLE.map((e) => [e.grade.toLowerCase(), e.index]),
)

/**
 * Map from index to grade string
 */
export const INDEX_TO_UIAA: Map<number, string> = new Map(
  UIAA_TABLE.map((e) => [e.index, e.grade]),
)
