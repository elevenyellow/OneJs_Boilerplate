import { type Level } from 'pino'

// Color themes
export type ColorTheme = 'default' | 'dark' | 'light' | 'minimal' | 'rainbow'

// Color configuration
export interface ColorConfig {
  // Theme selection
  theme?: ColorTheme

  // Custom colors for log levels
  levels?: {
    trace?: string
    debug?: string
    info?: string
    warn?: string
    error?: string
    fatal?: string
  }

  // Custom colors for debug keys
  debugKeys?: Record<string, string>

  // Custom colors for specific log types
  logTypes?: {
    userAction?: string
    systemInfo?: string
    businessLogic?: string
    deprecatedFeature?: string
    performanceWarning?: string
    securityWarning?: string
    configurationWarning?: string
    validationError?: string
    databaseError?: string
    apiError?: string
    authenticationError?: string
    systemError?: string
    businessError?: string
  }

  // Global color settings
  enabled?: boolean
  resetColor?: string
}

export interface LoggerConfig {
  level?: Level
  enableDebug?: boolean
  debugKeys?: string[]
  serverUrl?: string
  serviceName?: string
  colors?: ColorConfig
  /**
   * When true, routes info/warn/error/trace through the `debug` package
   * instead of pino. Output is controlled by the DEBUG env var.
   * Use in tests: DEBUG=oneJs:* bun test
   */
  debugMode?: boolean
}
