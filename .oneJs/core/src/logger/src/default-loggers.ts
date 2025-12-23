import debug from 'debug'
import { Logger } from './logger'
import type { LoggerConfig } from './logger-config.interface'

// Default instance
export const logger = new Logger()

// Factory function to create specific loggers
export function createLogger(config: LoggerConfig): Logger {
  return new Logger(config)
}

// Predefined debug keys
export const DEBUG_KEYS = {
  DATABASE: 'eyjslogger:database',
  API: 'eyjslogger:api',
  AUTH: 'eyjslogger:auth',
  CACHE: 'eyjslogger:cache',
  VALIDATION: 'eyjslogger:validation',
  PERFORMANCE: 'eyjslogger:performance',
} as const

// Debug utilities
export const debugUtils = {
  // Enable debug for multiple keys
  enableDebugKeys(...keys: string[]): void {
    keys.forEach((key) => logger.enableDebugKey(key))
  },

  // Disable debug for multiple keys
  disableDebugKeys(...keys: string[]): void {
    keys.forEach((key) => logger.disableDebugKey(key))
  },

  // Create a specific debug logger
  createDebugLogger(key: string): debug.Debugger {
    return logger.createDebugLogger(key)
  },
}

// Predefined debug loggers with custom colors
export const databaseDebug = logger.createDebugLogger(DEBUG_KEYS.DATABASE)
export const apiDebug = logger.createDebugLogger(DEBUG_KEYS.API)
export const authDebug = logger.createDebugLogger(DEBUG_KEYS.AUTH)
export const cacheDebug = logger.createDebugLogger(DEBUG_KEYS.CACHE)
export const validationDebug = logger.createDebugLogger(DEBUG_KEYS.VALIDATION)
export const performanceDebug = logger.createDebugLogger(DEBUG_KEYS.PERFORMANCE)
