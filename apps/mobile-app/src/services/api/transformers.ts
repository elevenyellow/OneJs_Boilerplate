import type { ScoredCragDto, WeatherConditionsDto } from '@/types/api'
import type { SectorUI } from '@/types/ui'
import { formatGradeRangeFromBands, type GradeSystem } from '@/utils/grades'

/**
 * Calculate the threshold for "good" season based on the data range.
 * Uses the midpoint between min and max scores.
 */
function getSeasonThreshold(seasonality: number[]): number {
  if (seasonality.length === 0) return 0
  const min = Math.min(...seasonality)
  const max = Math.max(...seasonality)
  return min + (max - min) * 0.5
}

/**
 * Check if current month is in optimal season for the crag.
 * Seasonality is always a 12-position score array (one per month).
 */
function isInOptimalSeason(seasonality: number[]): boolean {
  if (seasonality.length !== 12) return false
  const currentMonth = new Date().getMonth() // 0-11
  const currentScore = seasonality[currentMonth]
  const threshold = getSeasonThreshold(seasonality)
  return currentScore >= threshold
}

/**
 * Map weather conditions to condition badge
 * Uses actual per-crag weather evaluation when available,
 * falls back to seasonality-based approximation
 */
function mapWeatherToCondition(
  weatherConditions: WeatherConditionsDto | null,
  seasonality: number[],
): 'shade' | 'sun' | 'partial' | 'cloudy' {
  // If we have real weather evaluation, use it
  if (weatherConditions) {
    const { label } = weatherConditions

    switch (label) {
      case 'excellent':
        return 'sun'
      case 'good':
        return 'partial'
      case 'fair':
        return 'shade'
      case 'poor':
        return 'cloudy'
      default:
        // Fall through to seasonality-based
        break
    }
  }

  // Fallback to seasonality-based approximation
  return mapSeasonalityToCondition(seasonality)
}

/**
 * Map seasonality to condition badge (fallback when no weather data).
 * Based on current month and crag's seasonality scores.
 */
function mapSeasonalityToCondition(
  seasonality: number[],
): 'shade' | 'sun' | 'partial' | 'cloudy' {
  const currentMonth = new Date().getMonth() + 1 // 1-12
  const optimalSeason = isInOptimalSeason(seasonality)

  if (optimalSeason) {
    // Summer months (June-August) typically hot -> shade preferred
    if (currentMonth >= 6 && currentMonth <= 8) {
      return 'shade'
    }
    // Winter months (December-February) -> sun preferred
    if (currentMonth === 12 || currentMonth <= 2) {
      return 'sun'
    }
    // Spring/Fall -> partial
    return 'partial'
  }

  // Not optimal season -> cloudy/off-season
  return 'cloudy'
}

/**
 * Calculate placeholder temperature based on season.
 * Uses seasonality scores to determine if current month is optimal.
 */
function calculatePlaceholderTemperature(seasonality: number[]): number {
  const currentMonth = new Date().getMonth() + 1 // 1-12
  const optimalSeason = isInOptimalSeason(seasonality)

  // If current month is optimal, return comfortable temps
  if (optimalSeason) {
    // Summer: 20-25 C
    if (currentMonth >= 6 && currentMonth <= 8) {
      return Math.floor(Math.random() * 6) + 20 // 20-25
    }
    // Winter: 10-15 C
    if (currentMonth === 12 || currentMonth <= 2) {
      return Math.floor(Math.random() * 6) + 10 // 10-15
    }
    // Spring/Fall: 15-20 C
    return Math.floor(Math.random() * 6) + 15 // 15-20
  }

  // Off-season: variable temps
  return Math.floor(Math.random() * 15) + 10 // 10-24
}

/**
 * Generate placeholder image URL for crag
 * Uses Unsplash climbing images as placeholders
 */
function getPlaceholderImage(cragName: string): string {
  // Use crag name hash to get consistent image for same crag
  const hash = cragName.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0)
  }, 0)

  const imageIds = [
    'photo-1522163182402-834f871fd851', // Climber on rock
    'photo-1600612290209-158a25c798e2', // Mountain climbing
    'photo-1549480838-892408ec2009', // Rock face
    'photo-1563299796-b729d0af54a5', // Cliff climbing
    'photo-1564769662533-4f00dad7934f', // Boulder
    'photo-1583623063544-42b3b7593c6e', // Outdoor climbing
  ]

  const imageId = imageIds[hash % imageIds.length]
  return `https://images.unsplash.com/${imageId}?q=80&w=1350&auto=format&fit=crop`
}

/**
 * Format grade range from crag gradeBand data
 * Uses the shared GradeConverter to convert to user's preferred grading system
 */
function formatGradeRange(
  minGradeBand: number | null,
  maxGradeBand: number | null,
  gradeSystem: GradeSystem,
): string {
  const range = formatGradeRangeFromBands(
    minGradeBand,
    maxGradeBand,
    gradeSystem,
  )
  return range ?? ''
}

/**
 * Derive location name from crag name or coordinates
 * Placeholder until we have actual location data from backend
 */
function deriveLocationName(cragName: string): string {
  // For now, just use the crag name as location
  // In future, could reverse geocode coordinates or use region data
  return cragName
}

/**
 * Transform ScoredCragDto from backend to SectorUI for frontend
 *
 * @param crag Scored crag from backend API
 * @param gradeSystem User's preferred grading system for display
 * @returns SectorUI model for display
 */
export function scoredCragToSectorUI(
  crag: ScoredCragDto,
  gradeSystem: GradeSystem = 'french',
): SectorUI {
  // Routes in range is now provided directly by the API
  const totalRoutes = crag.numberRoutes ?? 0
  const routesInRange = crag.routesInRange ?? 0

  return {
    id: crag.id,
    name: crag.name,
    location: deriveLocationName(crag.name),
    imageUrl: crag.headerImage || getPlaceholderImage(crag.name),
    temperature: calculatePlaceholderTemperature(crag.seasonality),
    condition: mapWeatherToCondition(crag.weatherConditions, crag.seasonality),
    distanceKm: Math.round(crag.distanceKm * 10) / 10, // Round to 1 decimal
    routeCount: totalRoutes,
    routesInRange,
    gradeRange: formatGradeRange(
      crag.minGradeBand,
      crag.maxGradeBand,
      gradeSystem,
    ),
    isBestMatch: crag.totalScore > 0.8, // High score = best match
    latitude: crag.latitude,
    longitude: crag.longitude,
    weatherConditions: crag.weatherConditions ?? undefined,
    // NEW: Additional fields for enhanced UI
    type: crag.type,
    subType: crag.subType,
    seasonality: crag.seasonality,
    hasTopo: crag.hasTopo,
    totalScore: crag.totalScore,
    // NEW: Quality metrics
    overallScore: crag.overallScore,
    qualityRating: crag.qualityRating,
    popularityScore: crag.popularityScore,
  }
}

/**
 * Transform array of scored crags to sector UI models
 *
 * @param crags Array of scored crags from backend
 * @param gradeSystem User's preferred grading system for display
 * @returns Array of SectorUI models
 */
export function transformCragsToSectors(
  crags: ScoredCragDto[],
  gradeSystem: GradeSystem = 'french',
): SectorUI[] {
  return crags.map((crag) => scoredCragToSectorUI(crag, gradeSystem))
}
