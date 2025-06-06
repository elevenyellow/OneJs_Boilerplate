import { Response as ExpressResponse } from 'express'

export type Response = ExpressResponse

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T
  timestamp: string
  error?: {
    statusCode: number
    details?: string
  }
}

export function createSuccessResponse<T>(
  data: T,
  message = 'Success',
): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  }
}

export function createErrorResponse(
  message: string,
  statusCode: number,
  details?: string,
): ApiResponse {
  return {
    success: false,
    message,
    data: {},
    timestamp: new Date().toISOString(),
    error: {
      statusCode,
      ...(details && { details }),
    },
  }
}
