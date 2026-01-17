/**
 * DTO for Ascent database representation
 */
export interface AscentDatabaseDto {
  id: string
  userId: string
  routeId: string
  style: number
  gradeBand: number
  gradeEvaluation: number
  wallType: number | null
  characteristics: number
  safetyConcerns: number
  quality: number
  tries: number
  isRepeat: boolean
  comments: string | null
  ascentDate: Date
  createdAt: Date
  updatedAt: Date
}

/**
 * DTO for Ascent API response
 */
export interface AscentResponseDto {
  id: string
  userId: string
  routeId: string
  style: number
  gradeBand: number
  gradeEvaluation: number
  wallType: number | null
  characteristics: number
  safetyConcerns: number
  quality: number
  tries: number
  isRepeat: boolean
  comments: string | null
  ascentDate: string
  createdAt: string
}

/**
 * DTO for creating an ascent
 */
export interface CreateAscentInputDto {
  routeId: string
  style: number
  gradeBand: number
  gradeEvaluation: number
  wallType?: number | null
  characteristics: number
  safetyConcerns: number
  quality: number
  tries: number
  isRepeat: boolean
  comments?: string | null
  ascentDate: string
}

/**
 * DTO for Ascent with Route and Crag information
 */
export interface AscentWithRouteDto {
  id: string
  userId: string
  routeId: string
  style: number
  gradeBand: number
  gradeEvaluation: number
  wallType: number | null
  characteristics: number
  safetyConcerns: number
  quality: number
  tries: number
  isRepeat: boolean
  comments: string | null
  ascentDate: string
  createdAt: string
  route: {
    id: string
    name: string
    grade: string | null
    gradeBand: number
    stars: number | null
  }
  crag: {
    id: string
    name: string
  }
  sector: {
    id: string
    name: string
  } | null
}
