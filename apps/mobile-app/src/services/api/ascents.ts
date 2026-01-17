/**
 * Ascents API
 * API calls for ascent-related operations
 */

import { apiClient } from './apiClient'
import { ApiError } from './errors'
import type { LogAscentFormState } from '@/components/logbook/types'
import {
  ascentStyleToNumber,
  gradeEvaluationToNumber,
  wallTypeToNumber,
  characteristicsToBitmask,
  safetyConcernsToBitmask,
  convertUniversalGradeIndexToGradeBand,
} from '@/utils/ascentMappers'

/**
 * Response from creating an ascent
 */
export interface CreateAscentResponse {
  ascent: {
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
}

/**
 * Response from getting user ascents
 */
export interface GetUserAscentsResponse {
  ascents: Array<{
    id: string
    userId: string
    routeId: string
    style: number
    gradeBand: number // Ascent grade band (1-5)
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
      gradeBand: number // Route grade band (10-52)
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
  }>
}

/**
 * Get user ascents with route and crag information
 * GET /api/ascents
 *
 * @returns User ascents with route and crag details
 * @throws ApiError if the request fails
 */
export async function getUserAscents(): Promise<GetUserAscentsResponse> {
  try {
    return apiClient.get<GetUserAscentsResponse>('/ascents')
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw ApiError.unknown(error as Error)
  }
}

/**
 * Create a new ascent
 * POST /api/ascents
 *
 * Converts form values (strings/enums) to numeric values expected by the backend.
 * The backend stores numeric values.
 *
 * @param formState - Form state with string/enum values
 * @param routeId - Route identifier
 * @param routeGradeBand - Universal grade index (10-52), will be converted to grade band (1-5)
 * @returns Created ascent data
 * @throws ApiError if the request fails
 */
export async function createAscent(
  formState: LogAscentFormState,
  routeId: string,
  routeGradeBand: number,
): Promise<CreateAscentResponse> {
  try {
    // Convert universal grade index (10-52) to grade band (1-5)
    const gradeBand = convertUniversalGradeIndexToGradeBand(routeGradeBand)

    // Convert form values to numeric values expected by backend
    const dto = {
      routeId,
      style: ascentStyleToNumber(formState.style),
      gradeBand,
      gradeEvaluation: gradeEvaluationToNumber(formState.gradeEvaluation),
      wallType: wallTypeToNumber(formState.wallType),
      characteristics: characteristicsToBitmask(formState.characteristics),
      safetyConcerns: safetyConcernsToBitmask(formState.safetyConcerns),
      quality: formState.quality,
      tries: formState.tries,
      isRepeat: formState.isRepeat,
      comments: formState.comments || null,
      ascentDate: formState.date.toISOString(),
    }

    return apiClient.post<CreateAscentResponse>('/ascents', dto)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw ApiError.unknown(error as Error)
  }
}
