/**
 * Shared API types for cross-platform usage.
 *
 * These types are shared between backend (apps/api) and frontend (apps/mobile-app).
 * Any changes here should be coordinated across all consumers.
 *
 * Usage:
 * - Backend: import type { SearchCragsRequestDto } from '@shared/types/api'
 * - Frontend: import type { SearchCragsRequestDto } from '@shared/types/api' (via tsconfig paths)
 */

// Weather types
export type {
  WeatherConditionLabel,
  WeatherConditionsDto,
  ScoreLabel,
  WeatherMetricScoreDto,
  ClimbingConditionsResponseDto,
} from './weather.types'

// Search types
export type {
  SeasonPreference,
  ExposurePreference,
  SearchCragsRequestDto,
  ScoreBreakdownItemDto,
  ScoreBreakdownDto,
  ScoredCragDto,
  SearchCragsResponseDto,
} from './search.types'
