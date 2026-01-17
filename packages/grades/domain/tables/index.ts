export {
  BRITISH_TABLE,
  BRITISH_TO_INDEX,
  INDEX_TO_BRITISH,
} from './british.table'
export { FONT_TABLE, FONT_TO_INDEX, INDEX_TO_FONT } from './font.table'
export { FRENCH_TABLE, FRENCH_TO_INDEX, INDEX_TO_FRENCH } from './french.table'
export type { GradeTableEntry } from './french.table'
export { HUECO_TABLE, HUECO_TO_INDEX, INDEX_TO_HUECO } from './hueco.table'
export { INDEX_TO_UIAA, UIAA_TABLE, UIAA_TO_INDEX } from './uiaa.table'
export { INDEX_TO_YDS, YDS_TABLE, YDS_TO_INDEX } from './yds.table'

import type { GradeSystem } from '../types/grade-systems.types'
import { BRITISH_TO_INDEX, INDEX_TO_BRITISH } from './british.table'
import { FONT_TO_INDEX, INDEX_TO_FONT } from './font.table'
import { FRENCH_TO_INDEX, INDEX_TO_FRENCH } from './french.table'
import { HUECO_TO_INDEX, INDEX_TO_HUECO } from './hueco.table'
import { INDEX_TO_UIAA, UIAA_TO_INDEX } from './uiaa.table'
import { INDEX_TO_YDS, YDS_TO_INDEX } from './yds.table'

/**
 * Get the grade-to-index map for a specific system
 */
export function getGradeToIndexMap(system: GradeSystem): Map<string, number> {
  const maps: Record<GradeSystem, Map<string, number>> = {
    french: FRENCH_TO_INDEX,
    yds: YDS_TO_INDEX,
    uiaa: UIAA_TO_INDEX,
    british: BRITISH_TO_INDEX,
    font: FONT_TO_INDEX,
    hueco: HUECO_TO_INDEX,
  }
  return maps[system]
}

/**
 * Get the index-to-grade map for a specific system
 */
export function getIndexToGradeMap(system: GradeSystem): Map<number, string> {
  const maps: Record<GradeSystem, Map<number, string>> = {
    french: INDEX_TO_FRENCH,
    yds: INDEX_TO_YDS,
    uiaa: INDEX_TO_UIAA,
    british: INDEX_TO_BRITISH,
    font: INDEX_TO_FONT,
    hueco: INDEX_TO_HUECO,
  }
  return maps[system]
}
