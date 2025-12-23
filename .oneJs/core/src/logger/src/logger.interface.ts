import type debug from 'debug'

export interface ExtensibleLogger {
  // Support for: logger.info(contextPrefix, message, data)
  info(
    contextPrefix: string,
    message: string,
    data?: Record<string, unknown>,
  ): void
  // Support for: logger.info(message, data)
  info(message: string, data?: Record<string, unknown>): void
  // Support for: logger.warn(contextPrefix, message, data)
  warn(
    contextPrefix: string,
    message: string,
    data?: Record<string, unknown>,
  ): void
  // Support for: logger.warn(message, data)
  warn(message: string, data?: Record<string, unknown>): void
  // Support for: logger.error(contextPrefix, message, data)
  error(
    contextPrefix: string,
    message: string,
    data?: Record<string, unknown>,
  ): void
  // Support for: logger.error(message, data)
  error(message: string, data?: Record<string, unknown>): void
  debug(key: string, message: string, context?: Record<string, unknown>): void
  trace(message: string, context?: Record<string, unknown>): void
  createDebugLogger(key: string): debug.Debugger
}
