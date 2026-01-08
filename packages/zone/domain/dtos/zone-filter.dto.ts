import type { ClimbingType, GradeSystem } from '../entities/zone.entity'

export interface ZoneFilterDto {
  country?: string
  region?: string
  climbingTypes?: ClimbingType[]
  minRoutes?: number
  gradeMin?: string
  gradeMax?: string
  gradeSystem?: GradeSystem
  search?: string
  limit?: number
  offset?: number
}

export interface NearbyZoneFilterDto {
  latitude: number
  longitude: number
  radiusKm?: number // Default 50km
  limit?: number
}

export interface ZoneSearchDto {
  query: string
  filters?: ZoneFilterDto
}


