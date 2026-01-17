/**
 * Hueco (V-Scale) grading system table
 * Used for bouldering, primarily in USA
 */

import type { GradeTableEntry } from './french.table'

/**
 * Hueco/V-Scale grades mapped to universal index
 */
export const HUECO_TABLE: GradeTableEntry[] = [
  { grade: 'VB', index: 10 },
  { grade: 'V0', index: 14 },
  { grade: 'V1', index: 18 },
  { grade: 'V2', index: 20 },
  { grade: 'V3', index: 22 },
  { grade: 'V4', index: 26 },
  { grade: 'V5', index: 28 },
  { grade: 'V6', index: 30 },
  { grade: 'V7', index: 32 },
  { grade: 'V8', index: 34 },
  { grade: 'V9', index: 36 },
  { grade: 'V10', index: 38 },
  { grade: 'V11', index: 40 },
  { grade: 'V12', index: 42 },
  { grade: 'V13', index: 44 },
  { grade: 'V14', index: 46 },
  { grade: 'V15', index: 48 },
  { grade: 'V16', index: 50 },
  { grade: 'V17', index: 52 },
]

/**
 * Map from grade string to index (case insensitive)
 */
export const HUECO_TO_INDEX: Map<string, number> = new Map(
  HUECO_TABLE.map((e) => [e.grade.toLowerCase(), e.index]),
)

/**
 * Map from index to grade string
 */
export const INDEX_TO_HUECO: Map<number, string> = new Map(
  HUECO_TABLE.map((e) => [e.index, e.grade]),
)
