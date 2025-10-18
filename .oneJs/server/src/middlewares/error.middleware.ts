import { EyJsError, logger } from '../../../core/src'

export function createErrorHandler() {
  return ({ code, error, set }: { code: string; error: Error; set: any }) => {
    const isDevelopment = process.env.NODE_ENV === 'development'
    const isEyJsError = error instanceof EyJsError

    const status = isEyJsError ? error.statusCode : 500
    const message = isDevelopment
      ? error.message
      : isEyJsError
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
