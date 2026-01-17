/**
 * YDS (Yosemite Decimal System) grading table
 * Used primarily in USA
 */

import type { GradeTableEntry } from './french.table'

/**
 * YDS grades mapped to universal index
 */
export const YDS_TABLE: GradeTableEntry[] = [
  { grade: '5.2', index: 10 },
  { grade: '5.3', index: 11 },
  { grade: '5.4', index: 12 },
  { grade: '5.5', index: 14 },
  { grade: '5.6', index: 16 },
  { grade: '5.7', index: 18 },
  { grade: '5.8', index: 20 },
  { grade: '5.9', index: 22 },
  { grade: '5.10a', index: 24 },
  { grade: '5.10b', index: 25 },
  { grade: '5.10c', index: 26 },
  { grade: '5.10d', index: 27 },
  { grade: '5.11a', index: 28 },
  { grade: '5.11b', index: 29 },
  { grade: '5.11c', index: 30 },
  { grade: '5.11d', index: 31 },
  { grade: '5.12a', index: 32 },
  { grade: '5.12b', index: 33 },
  { grade: '5.12c', index: 34 },
  { grade: '5.12d', index: 35 },
  { grade: '5.13a', index: 36 },
  { grade: '5.13b', index: 37 },
  { grade: '5.13c', index: 38 },
  { grade: '5.13d', index: 39 },
  { grade: '5.14a', index: 40 },
  { grade: '5.14b', index: 41 },
  { grade: '5.14c', index: 42 },
  { grade: '5.14d', index: 43 },
  { grade: '5.15a', index: 44 },
  { grade: '5.15b', index: 45 },
  { grade: '5.15c', index: 46 },
]

/**
 * Map from grade string to index
 */
export const YDS_TO_INDEX: Map<string, number> = new Map(
  YDS_TABLE.map((e) => [e.grade.toLowerCase(), e.index]),
)

/**
 * Map from index to grade string
 */
export const INDEX_TO_YDS: Map<number, string> = new Map(
  YDS_TABLE.map((e) => [e.index, e.grade]),
)
