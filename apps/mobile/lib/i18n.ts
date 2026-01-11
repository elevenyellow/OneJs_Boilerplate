/**
 * Internationalization utilities for the mobile app
 */

// UI translations (English)
export const translations = {
  openInMaps: 'Open in maps',
  howToGetThere: 'How to get there',
  selectLanguage: 'Select language',
  noApproachInfo: 'No access information available',
  description: 'Description',
  approach: 'Approach',
  // Zone/Area stats
  sectors: 'Sectors',
  routes: 'Routes',
  inRange: 'In range',
  go: 'Go',
  directions: 'Directions',
  gradeRange: 'Grade range',
  altitude: 'Altitude',
  styles: 'Styles',
  getDirections: 'Get Directions',
  // Weather
  weather: 'Weather',
  bestDay: 'Best day',
  today: 'Today',
  // Climbing
  climbingTypes: 'Climbing types',
  bestSeason: 'Best season',
  recommendedSectors: 'Recommended sectors',
  viewAllSectors: 'View all sectors',
  noNearbySectors: 'No nearby sectors found',
  searchingSectors: 'Searching sectors...',
} as const

export type TranslationKey = keyof typeof translations

/**
 * Get translation for a key
 */
export function t(key: TranslationKey): string {
  return translations[key]
}

/**
 * Language flags and names mapping
 */
export const LANGUAGE_FLAGS: Record<string, { flag: string; name: string }> = {
  es: { flag: '🇪🇸', name: 'Español' },
  gb: { flag: '🇬🇧', name: 'English' },
  en: { flag: '🇬🇧', name: 'English' },
  fr: { flag: '🇫🇷', name: 'Français' },
  de: { flag: '🇩🇪', name: 'Deutsch' },
  it: { flag: '🇮🇹', name: 'Italiano' },
  pt: { flag: '🇵🇹', name: 'Português' },
  nl: { flag: '🇳🇱', name: 'Nederlands' },
  pl: { flag: '🇵🇱', name: 'Polski' },
  ca: { flag: '🏴󠁥󠁳󠁣󠁴󠁿', name: 'Català' },
  eu: { flag: '🏴', name: 'Euskara' },
  gl: { flag: '🏴', name: 'Galego' },
}

/**
 * Get language info (flag and name) for a language code
 */
export function getLanguageInfo(code: string): { flag: string; name: string } {
  const lowerCode = code.toLowerCase()
  return LANGUAGE_FLAGS[lowerCode] || { flag: '🏳️', name: code.toUpperCase() }
}

/**
 * Parse approach text by language markers
 * Supports format :xx: where xx is a 2-letter language code
 */
export function parseApproachByLanguage(text: string): Record<string, string> {
  // Regex to find blocks :xx: 
  const regex = /:([a-z]{2}):\s*/gi
  const matches = [...text.matchAll(regex)]
  
  if (matches.length === 0) {
    // No language markers, return as 'default'
    return { default: text.trim() }
  }
  
  const result: Record<string, string> = {}
  matches.forEach((match, i) => {
    const lang = match[1].toLowerCase()
    const start = match.index! + match[0].length
    const end = matches[i + 1]?.index ?? text.length
    const content = text.slice(start, end).trim()
    if (content) {
      result[lang] = content
    }
  })
  
  return result
}
