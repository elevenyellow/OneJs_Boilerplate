import type debug from 'debug'

export interface ExtensibleLogger {
  info(key: string, message: string, context?: Record<string, unknown>): void
  warn(key: string, message: string, context?: Record<string, unknown>): void
  error(key: string, message: string, context?: Record<string, unknown>): void
  debug(key: string, message: string, context?: Record<string, unknown>): void
  trace(key: string, message: string, context?: Record<string, unknown>): void
  createDebugLogger(key: string): debug.Debugger
}
