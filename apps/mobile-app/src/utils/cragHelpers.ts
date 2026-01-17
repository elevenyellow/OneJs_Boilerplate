/**
 * Crag Helper Utilities
 * Functions to process and format crag data for display
 */

/**
 * Season score threshold for determining "in season" vs "off season"
 * Uses dynamic threshold based on the data range (midpoint between min and max)
 */
const SEASON_THRESHOLD_PERCENTAGE = 0.5 // 50% of the range

/**
 * Calculate the threshold for "good" months based on the data range.
 * Uses the midpoint between min and max scores.
 */
function getSeasonThreshold(seasonality: number[]): number {
  if (seasonality.length === 0) return 0
  const min = Math.min(...seasonality)
  const max = Math.max(...seasonality)
  // Threshold at 50% of the range between min and max
  return min + (max - min) * SEASON_THRESHOLD_PERCENTAGE
}

/**
 * Check if current month is in optimal season
 *
 * Data Format: Array of 12 scores (one per month)
 * ================================================
 *
 * theCrag returns seasonality as an array of 12 scores:
 *
 * Example: [85, 90, 80, 65, 45, 30, 25, 28, 40, 60, 75, 88]
 * Index:    0   1   2   3   4   5   6   7   8   9  10  11
 * Month:   Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
 *
 * Higher values = better climbing conditions for that month.
 *
 * The threshold for "in season" is calculated dynamically as the midpoint
 * between min and max scores in the array. This handles all scenarios:
 * - Winter crags with low summer scores: [10, 8, 5, 3, 2, 1, 1, 1, 2, 5, 8, 10]
 * - Summer crags with low winter scores: [20, 25, 40, 70, 90, 95, 98, 95, 80, 50, 30, 22]
 * - Year-round crags: [70, 72, 75, 80, 82, 78, 75, 76, 80, 78, 72, 70]
 */
export function isInOptimalSeason(seasonality?: number[]): boolean {
  if (!seasonality || seasonality.length !== 12) return false

  const currentMonth = new Date().getMonth() // 0-11
  const currentScore = seasonality[currentMonth]
  const threshold = getSeasonThreshold(seasonality)

  return currentScore >= threshold
}

/**
 * Format seasonality months to readable string
 * Shows the range of months with good climbing conditions.
 *
 * Example: [85, 90, 80, 65, 45, 30, 25, 28, 40, 60, 75, 88] -> "Oct-Mar"
 * (months where score >= threshold)
 */
export function formatSeasonalityRange(seasonality?: number[]): string | null {
  if (!seasonality || seasonality.length !== 12) return null

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]

  const threshold = getSeasonThreshold(seasonality)

  // Extract months with score >= threshold
  const goodMonths = seasonality
    .map((score, index) => (score >= threshold ? index + 1 : null))
    .filter((month): month is number => month !== null)

  if (goodMonths.length === 0) return null
  if (goodMonths.length >= 11) return 'Year-round'

  // Sort months
  const sorted = [...goodMonths].sort((a, b) => a - b)

  // Find continuous ranges (handle wrap-around for winter crags)
  const ranges: number[][] = []
  let currentRange: number[] = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === currentRange[currentRange.length - 1] + 1) {
      currentRange.push(sorted[i])
    } else {
      ranges.push(currentRange)
      currentRange = [sorted[i]]
    }
  }
  ranges.push(currentRange)

  // Format ranges
  const formatted = ranges.map((range) => {
    if (range.length === 1) {
      return monthNames[range[0] - 1]
    }
    return `${monthNames[range[0] - 1]}-${monthNames[range[range.length - 1] - 1]}`
  })

  return formatted.join(', ')
}

/**
 * Get climbing style display info from type/subType
 */
export function getClimbingStyleInfo(
  type?: string,
  subType?: string,
): {
  label: string
  icon: string
  color: string
} | null {
  if (!type && !subType) return null

  // Map subType to display info
  const subTypeMap: Record<
    string,
    { label: string; icon: string; color: string }
  > = {
    SPORT_CLIMBING: {
      label: 'Sport',
      icon: '🧗',
      color: '#14b8a6', // accent
    },
    TRAD_CLIMBING: {
      label: 'Trad',
      icon: '⚙️',
      color: '#f59e0b', // warning
    },
    BOULDERING: {
      label: 'Boulder',
      icon: '🪨',
      color: '#a855f7', // purple
    },
    MIXED: {
      label: 'Mixed',
      icon: '🔀',
      color: '#9ca3af', // gray
    },
    DEEP_WATER_SOLO: {
      label: 'DWS',
      icon: '🌊',
      color: '#3b82f6', // blue
    },
  }

  if (subType && subTypeMap[subType]) {
    return subTypeMap[subType]
  }

  // Fallback to type
  const typeMap: Record<
    string,
    { label: string; icon: string; color: string }
  > = {
    CRAG: {
      label: 'Crag',
      icon: '🧗',
      color: '#14b8a6',
    },
    BOULDER_AREA: {
      label: 'Boulder',
      icon: '🪨',
      color: '#a855f7',
    },
  }

  if (type && typeMap[type]) {
    return typeMap[type]
  }

  return null
}

/**
 * Format match score as percentage
 */
export function formatMatchScore(totalScore?: number): string | null {
  if (totalScore === undefined || totalScore === null) return null
  return `${Math.round(totalScore * 100)}%`
}

/**
 * Get match score color based on value
 */
export function getMatchScoreColor(totalScore?: number): string {
  if (totalScore === undefined || totalScore === null) return '#6b7280' // gray

  if (totalScore >= 0.8) return '#22c55e' // green - excellent
  if (totalScore >= 0.6) return '#14b8a6' // accent - good
  if (totalScore >= 0.4) return '#f59e0b' // warning - fair
  return '#6b7280' // gray - low
}

/**
 * Generate synthetic wind data based on weather conditions
 * Returns wind speed in km/h
 *
 * NOTE: This is synthetic data for UI purposes.
 * Real wind data should come from Open-Meteo API.
 */
export function getSyntheticWindSpeed(overallScore?: number): number {
  if (overallScore === undefined || overallScore === null) return 15

  // Higher score = less wind (better conditions)
  // Score range: 0-4, Wind range: 5-40 km/h
  const windSpeed = 40 - (overallScore / 4) * 35
  return Math.round(windSpeed)
}

/**
 * Generate synthetic humidity data based on weather conditions
 * Returns humidity percentage (0-100)
 *
 * NOTE: This is synthetic data for UI purposes.
 * Real humidity data should come from Open-Meteo API.
 */
export function getSyntheticHumidity(overallScore?: number): number {
  if (overallScore === undefined || overallScore === null) return 60

  // Higher score = lower humidity (better conditions)
  // Score range: 0-4, Humidity range: 30-80%
  const humidity = 80 - (overallScore / 4) * 50
  return Math.round(humidity)
}

/**
 * Get wind speed display with icon
 */
export function formatWindSpeed(windSpeedKmh: number): string {
  return `${windSpeedKmh} km/h`
}

/**
 * Get humidity display with icon
 */
export function formatHumidity(humidityPercent: number): string {
  return `${humidityPercent}%`
}

/**
 * Get wind condition color based on speed
 */
export function getWindConditionColor(windSpeedKmh: number): string {
  if (windSpeedKmh <= 10) return '#22c55e' // green - calm
  if (windSpeedKmh <= 20) return '#14b8a6' // accent - light
  if (windSpeedKmh <= 30) return '#f59e0b' // warning - moderate
  return '#ef4444' // red - strong
}

/**
 * Get humidity condition color based on percentage
 */
export function getHumidityConditionColor(humidityPercent: number): string {
  if (humidityPercent <= 40) return '#22c55e' // green - low/dry
  if (humidityPercent <= 60) return '#14b8a6' // accent - comfortable
  if (humidityPercent <= 75) return '#f59e0b' // warning - humid
  return '#ef4444' // red - very humid
}
