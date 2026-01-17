/**
 * Shared weather-related API types used by both backend and frontend.
 * These types should be kept in sync between all consumers.
 */

/**
 * Weather condition label for climbing conditions
 */
export type WeatherConditionLabel = 'excellent' | 'good' | 'fair' | 'poor'

/**
 * Weather conditions evaluation for a crag/sector
 */
export interface WeatherConditionsDto {
  totalSectors: number
  sectorsWithGoodConditions: number
  overallScore: number
  label: WeatherConditionLabel
}

/**
 * Score label for individual weather metrics (temperature, wind, etc.)
 */
export type ScoreLabel = 'excellent' | 'good' | 'moderate' | 'poor'

/**
 * Individual weather metric score
 */
export interface WeatherMetricScoreDto {
  score: number
  label: ScoreLabel
  value?: number
  details?: Record<string, unknown>
}

/**
 * Climbing conditions response DTO
 */
export interface ClimbingConditionsResponseDto {
  timestamp: string
  coordinates: {
    latitude: number
    longitude: number
  }
  temperature: WeatherMetricScoreDto
  wind: WeatherMetricScoreDto
  humidity: WeatherMetricScoreDto
  precipitation: WeatherMetricScoreDto
  overall: {
    score: number
    label: ScoreLabel
  }
  recommendation: string
}
