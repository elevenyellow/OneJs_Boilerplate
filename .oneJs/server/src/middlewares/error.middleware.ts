import { logger, OneJsError } from '@OneJs/core'

export function createErrorHandler() {
  return ({ code, error, set }: { code: string; error: Error; set: any }) => {
    const isDevelopment = process.env.NODE_ENV === 'development'
    const isOneJsError = error instanceof OneJsError

    const status = isOneJsError ? error.statusCode : 500
    const message = isDevelopment
      ? error.message
      : isOneJsError
        ? error.message
        : 'Internal Server Error'

    // Log the error with context
    logger.error(message, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        status,
        code,
      },
    })

    set.status = status
    return {
      success: false,
      message,
      error: {
        statusCode: status,
        ...(isDevelopment && {
          details: error.explanatoryMessage || error.message,
        }),
      },
      data: {},
      timestamp: new Date().toISOString(),
    }
  }
}
