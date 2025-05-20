import type { Request, Response, NextFunction } from 'express'
import { EyJsError } from '../ey-js.error'
import { logger } from '../../logger'

export function ErrorMiddleware(
  err: Error | EyJsError,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isEyJsError = err instanceof EyJsError

  const status = isEyJsError ? err.statusCode : 500
  const message = isDevelopment
    ? err.message
    : isEyJsError
      ? err.message
      : 'Internal Server Error'

  // Log the error with context (mantenemos el logging detallado para debugging)
  logger.error(message, {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      status,
      path: req.path,
      method: req.method,
      body: req.body,
      query: req.query,
      params: req.params,
      headers: req.headers,
    },
  })

  const errorResponse = {
    success: false,
    message,
    error: {
      statusCode: status,
      ...(isDevelopment && {
        details: err.explanatoryMessage || err.message,
      }),
    },
    data: {},
    timestamp: new Date().toISOString(),
  }

  return res.status(status).json(errorResponse)
}
