// Proxy configuration
export { getProxyUrls, hasProxyUrls } from './proxies'

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
} from './query-codes'

export type {
  GradeSystemCode as GradeSystemCodeType,
  SeasonCode as SeasonCodeType,
  ExposureCode as ExposureCodeType,
  DistanceUnitCode as DistanceUnitCodeType,
  WeatherConditionCode as WeatherConditionCodeType,
  CrowdLevelCode as CrowdLevelCodeType,
  WalkInTimeCode as WalkInTimeCodeType,
  AspectCode as AspectCodeType,
  FamilyCode as FamilyCodeType,
  ClimbingStyleCode as ClimbingStyleCodeType,
} from './query-codes'
