import { logger } from '@OneJs/core'
import { Context } from 'elysia'
import { createSuccessResponse } from '../types/response'

export function responseMiddleware() {
  return async (context: Context) => {
    logger.debug(
      'oneJs:server',
      `Request: ${context.request.method} ${context.request.url}`,
    )

    const originalResponse = context.body

    if (
      originalResponse &&
      typeof originalResponse === 'object' &&
      'success' in originalResponse
    ) {
      return originalResponse
    }

    const formattedResponse = createSuccessResponse(originalResponse)
    context.body = formattedResponse
    return formattedResponse
  }
}
