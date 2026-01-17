/**
 * French grading system table
 * This is the base system - all other systems map to French index
 */

export interface GradeTableEntry {
  grade: string
  index: number
}

/**
 * French grades with their universal index
 * Index range: 10-50 (expandable)
 */
export const FRENCH_TABLE: GradeTableEntry[] = [
  { grade: '3', index: 10 },
  { grade: '3+', index: 11 },
  { grade: '4a', index: 12 },
  { grade: '4a+', index: 13 },
  { grade: '4b', index: 14 },
  { grade: '4b+', index: 15 },
  { grade: '4c', index: 16 },
  { grade: '4c+', index: 17 },
  { grade: '5a', index: 18 },
  { grade: '5a+', index: 19 },
  { grade: '5b', index: 20 },
  { grade: '5b+', index: 21 },
  { grade: '5c', index: 22 },
  { grade: '5c+', index: 23 },
  { grade: '6a', index: 24 },
  { grade: '6a+', index: 25 },
  { grade: '6b', index: 26 },
  { grade: '6b+', index: 27 },
  { grade: '6c', index: 28 },
  { grade: '6c+', index: 29 },
  { grade: '7a', index: 30 },
  { grade: '7a+', index: 31 },
  { grade: '7b', index: 32 },
  { grade: '7b+', index: 33 },
  { grade: '7c', index: 34 },
  { grade: '7c+', index: 35 },
  { grade: '8a', index: 36 },
  { grade: '8a+', index: 37 },
  { grade: '8b', index: 38 },
  { grade: '8b+', index: 39 },
  { grade: '8c', index: 40 },
  { grade: '8c+', index: 41 },
  { grade: '9a', index: 42 },
  { grade: '9a+', index: 43 },
  { grade: '9b', index: 44 },
  { grade: '9b+', index: 45 },
  { grade: '9c', index: 46 },
]

/**
 * Map from grade string to index
 */
export const FRENCH_TO_INDEX: Map<string, number> = new Map(
  FRENCH_TABLE.map((e) => [e.grade.toLowerCase(), e.index]),
)

/**
 * Map from index to grade string
 */
export const INDEX_TO_FRENCH: Map<number, string> = new Map(
  FRENCH_TABLE.map((e) => [e.index, e.grade]),
)
