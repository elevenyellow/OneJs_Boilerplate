// Domain Value Objects
export {
  ParsedBeta,
  type BetaItem,
  type BetaKeyInfo,
  type BetaSection,
  type ParsedBetaItem,
} from './domain/value-objects'

// Constants - Proxy configuration
export { getProxyUrls, hasProxyUrls } from './constants'

// Constants - Query Codes
export {
  // Grade System
  GradeSystemCode,
  GRADE_SYSTEM_FROM_CODE,
  GRADE_SYSTEM_TO_CODE,
  // Season
  SeasonCode,
  SEASON_FROM_CODE,
  SEASON_TO_CODE,
  // Exposure
  ExposureCode,
  EXPOSURE_FROM_CODE,
  EXPOSURE_TO_CODE,
  // Distance Unit
  DistanceUnitCode,
  DISTANCE_UNIT_FROM_CODE,
  DISTANCE_UNIT_TO_CODE,
  MILES_TO_KM,
  // Weather
  WeatherConditionCode,
  WEATHER_FROM_CODE,
  // Crowd
  CrowdLevelCode,
  CROWD_FROM_CODE,
  // Walk-in Time
  WalkInTimeCode,
  WALK_IN_FROM_CODE,
  // Aspect
  AspectCode,
  ASPECT_FROM_CODE,
  // Family
  FamilyCode,
  FAMILY_FROM_CODE,
  // Climbing Style
  ClimbingStyleCode,
  STYLE_FROM_CODE,
  // Grade Index
  GradeIndex,
  // Query Params
  QueryParam,
} from './constants'

// Utils - Query Parsers
export {
  parseGradeSystem,
  parseSeasonPreference,
  parseExposurePreference,
  parseDistanceUnit,
  parseRadiusToKm,
  parseGradeIndex,
  parseOptionalGradeIndex,
  parseNumber,
  parseRequiredNumber,
  parseLatitude,
  parseLongitude,
  parseEnumCode,
} from './utils'

// Shared API Types
export type {
  // Weather types
  WeatherConditionLabel,
  WeatherConditionsDto,
  ScoreLabel,
  WeatherMetricScoreDto,
  ClimbingConditionsResponseDto,
  // Search types
  SeasonPreference,
  ExposurePreference,
  SearchCragsRequestDto,
  ScoreBreakdownItemDto,
  ScoreBreakdownDto,
  ScoredCragDto,
  SearchCragsResponseDto,
} from './types/api'
