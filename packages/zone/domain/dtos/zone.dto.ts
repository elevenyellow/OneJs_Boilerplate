import type {
  ClimbingType,
  GradeRange,
  ZoneStats,
} from '../entities/zone.entity'

export interface ZoneDto {
  id: string
  name: string
  description: string
  country: string
  region: string
  coordinates: {
    latitude: number
    longitude: number
  }
  climbingTypes: ClimbingType[]
  gradeRange: GradeRange
  stats: ZoneStats
  theCragUrl: string
  imageUrl?: string
  altitude?: number
  approach?: string
  bestSeasons?: string[]
  createdAt?: Date
  updatedAt?: Date
}

export interface ZoneListItemDto {
  id: string
  name: string
  country: string
  region: string
  coordinates: {
    latitude: number
    longitude: number
  }
  climbingTypes: ClimbingType[]
  totalRoutes: number
  imageUrl?: string
  distance?: number // Distance from user in km (when using nearby search)
}

export interface ZoneDetailDto extends ZoneDto {
  // Can be extended with weather data or other related info
}
