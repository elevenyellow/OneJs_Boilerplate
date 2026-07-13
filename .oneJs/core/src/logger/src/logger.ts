import debug from 'debug'
import pino, { type BaseLogger, type LoggerOptions } from 'pino'
import pretty from 'pino-pretty'
import { Injectable } from '../../container/decorators'
import { ColorManager } from './color-themes'
import { getConfigFromEnv, mergeConfig } from './env-config'
import { type ExtensibleLogger } from './logger.interface'
import {
  type ColorConfig,
  type ColorTheme,
  type LoggerConfig,
} from './logger-config.interface'

@Injectable()
export class Logger implements ExtensibleLogger {
  private readonly logger: BaseLogger
  private readonly debugEnabled: boolean
  private readonly debugKeys: Set<string>
  private readonly debugLoggers: Map<string, debug.Debugger> = new Map()
  private readonly colorManager: ColorManager
  private readonly debugMode: boolean

  // Named debug loggers for each level (used in debugMode)
  private readonly debugInfo: debug.Debugger
  private readonly debugWarn: debug.Debugger
  private readonly debugError: debug.Debugger
  private readonly debugTrace: debug.Debugger

  constructor(config: LoggerConfig = {}, useEnv: boolean = false) {
    // Si useEnv es true, cargar configuración desde .env
    const finalConfig = useEnv
      ? mergeConfig(getConfigFromEnv(), config)
      : config

    const {
      level = 'info',
      enableDebug = true,
      debugKeys = [],
      serverUrl,
      colors = {},
      debugMode = false,
    } = finalConfig

    this.debugEnabled = enableDebug
    this.debugKeys = new Set(debugKeys)
    this.colorManager = new ColorManager(colors)
    this.debugMode = debugMode

    this.debugInfo = debug('oneJs:info')
    this.debugWarn = debug('oneJs:warn')
    this.debugError = debug('oneJs:error')
    this.debugTrace = debug('oneJs:trace')

    // Configure transport for Pino - simplified without custom colors
    const transportOptions: Record<string, unknown> = {
      colorize: false, // Disable Pino's colors
      colorizeObjects: false,
      // Simple format without custom prettifiers
      messageFormat: (log: Record<string, unknown>, messageKey: string) => {
        return String(log[messageKey] ?? '')
      },
    }

    // If there's a server URL, configure for remote sending
    if (serverUrl) {
      transportOptions['target'] = 'pino-http-send'
      transportOptions['options'] = {
        url: serverUrl,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    } else {
      transportOptions['target'] = 'pino-pretty'
    }

    const transport = pretty(transportOptions)

    const options: LoggerOptions = {
      level: debugMode ? 'silent' : level,
      base: {
        timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
      },
    }

    this.logger = pino(options, transport)

    // Configure debug colors
    this.setupDebugColors()
  }

  private setupDebugColors(): void {
    const originalLog = debug.log
    if (originalLog) {
      debug.log = (str: string) => {
        const key = str.split(' ')[0]
        const color = key ? this.colorManager.getDebugKeyColor(key) : ''
        const reset = this.colorManager.getResetColor()
        originalLog(`${color}${str}${reset}`)
      }
    }
  }

  setColorTheme(theme: string): void {
    this.colorManager.addCustomColors({
      theme: theme as ColorTheme,
    })
  }

  addCustomColors(customColors: Partial<ColorConfig>): void {
    this.colorManager.addCustomColors(customColors)
  }

  disableColors(): void {
    this.colorManager.disableColors()
  }

  enableColors(): void {
    this.colorManager.enableColors()
  }

  /**
   * Formats a log message with colors for different parts:
   * - Level indicator (INFO, WARN, ERROR) in level color
   * - Context prefix (MATO:INSTAGRAM_WORKER:...) in cyan
   * - Message text in white/gray
   */
  private formatColoredMessage(
    level: 'info' | 'warn' | 'error' | 'trace',
    contextPrefix: string | undefined,
    message: string,
  ): string {
    if (!this.colorManager.config.enabled) {
      return contextPrefix ? `${contextPrefix} ${message}` : message
    }

    const reset = this.colorManager.getResetColor()
    const levelColor = this.colorManager.getLevelColor(level)
    const contextColor = '\x1b[36m' // Cyan for context prefix
    const messageColor = '\x1b[37m' // White for message text
    const dimColor = '\x1b[90m' // Gray for level indicator brackets

    const levelLabel = level.toUpperCase()
    const levelIndicator = `${dimColor}[${reset}${levelColor}${levelLabel}${reset}${dimColor}]${reset}`

    if (contextPrefix) {
      // Format: [INFO] MATO:CONTEXT:FEATURE Message text
      return `${levelIndicator} ${contextColor}${contextPrefix}${reset} ${messageColor}${message}${reset}`
    }

    // Format: [INFO] Message text (no context)
    return `${levelIndicator} ${messageColor}${message}${reset}`
  }

  info(
    contextPrefixOrMessage: string,
    messageOrData?: string | Record<string, unknown>,
    data?: Record<string, unknown>,
  ): void {
    if (this.debugMode) {
      const msg = this.buildDebugMessage(
        contextPrefixOrMessage,
        messageOrData,
        data,
      )
      this.debugInfo(msg)
      return
    }

    // Handle case: logger.info(contextPrefix, message, data)
    if (
      typeof contextPrefixOrMessage === 'string' &&
      typeof messageOrData === 'string' &&
      data !== undefined
    ) {
      const coloredMessage = this.formatColoredMessage(
        'info',
        contextPrefixOrMessage,
        messageOrData,
      )
      this.logger.info(data, coloredMessage)
      return
    }

    // Handle case: logger.info(contextPrefix, message) - no data
    if (
      typeof contextPrefixOrMessage === 'string' &&
      typeof messageOrData === 'string'
    ) {
      const coloredMessage = this.formatColoredMessage(
        'info',
        contextPrefixOrMessage,
        messageOrData,
      )
      this.logger.info(coloredMessage)
      return
    }

    // Standard case: logger.info(message, data)
    const coloredMessage = this.formatColoredMessage(
      'info',
      undefined,
      contextPrefixOrMessage,
    )
    this.logger.info(
      messageOrData as Record<string, unknown> | undefined,
      coloredMessage,
    )
  }

  warn(
    contextPrefixOrMessage: string,
    messageOrData?: string | Record<string, unknown>,
    data?: Record<string, unknown>,
  ): void {
    if (this.debugMode) {
      const msg = this.buildDebugMessage(
        contextPrefixOrMessage,
        messageOrData,
        data,
      )
      this.debugWarn(msg)
      return
    }

    // Handle case: logger.warn(contextPrefix, message, data)
    if (
      typeof contextPrefixOrMessage === 'string' &&
      typeof messageOrData === 'string' &&
      data !== undefined
    ) {
      const coloredMessage = this.formatColoredMessage(
        'warn',
        contextPrefixOrMessage,
        messageOrData,
      )
      this.logger.warn(data, coloredMessage)
      return
    }

    // Handle case: logger.warn(contextPrefix, message) - no data
    if (
      typeof contextPrefixOrMessage === 'string' &&
      typeof messageOrData === 'string'
    ) {
      const coloredMessage = this.formatColoredMessage(
        'warn',
        contextPrefixOrMessage,
        messageOrData,
      )
      this.logger.warn(coloredMessage)
      return
    }

    // Standard case: logger.warn(message, data)
    const coloredMessage = this.formatColoredMessage(
      'warn',
      undefined,
      contextPrefixOrMessage,
    )
    this.logger.warn(
      messageOrData as Record<string, unknown> | undefined,
      coloredMessage,
    )
  }

  error(
    contextPrefixOrMessage: string,
    messageOrData?: string | Record<string, unknown>,
    data?: Record<string, unknown>,
  ): void {
    if (this.debugMode) {
      const msg = this.buildDebugMessage(
        contextPrefixOrMessage,
        messageOrData,
        data,
      )
      this.debugError(msg)
      return
    }

    // Handle case: logger.error(contextPrefix, message, data)
    if (
      typeof contextPrefixOrMessage === 'string' &&
      typeof messageOrData === 'string' &&
      data !== undefined
    ) {
      const coloredMessage = this.formatColoredMessage(
        'error',
        contextPrefixOrMessage,
        messageOrData,
      )
      this.logger.error(data, coloredMessage)
      return
    }

    // Handle case: logger.error(contextPrefix, message) - no data
    if (
      typeof contextPrefixOrMessage === 'string' &&
      typeof messageOrData === 'string'
    ) {
      const coloredMessage = this.formatColoredMessage(
        'error',
        contextPrefixOrMessage,
        messageOrData,
      )
      this.logger.error(coloredMessage)
      return
    }

    // Standard case: logger.error(message, data)
    const coloredMessage = this.formatColoredMessage(
      'error',
      undefined,
      contextPrefixOrMessage,
    )
    this.logger.error(
      messageOrData as Record<string, unknown> | undefined,
      coloredMessage,
    )
  }

  debug(key: string, message: string, context?: Record<string, unknown>): void {
    if (!this.debugEnabled) return

    let debugLogger = this.debugLoggers.get(key)
    if (!debugLogger) {
      debugLogger = debug(key)
      this.debugLoggers.set(key, debugLogger)
    }

    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    debugLogger(`${message}${contextStr}`)
  }

  trace(message: string, context?: Record<string, unknown>): void {
    if (this.debugMode) {
      const contextStr = context ? ` ${JSON.stringify(context)}` : ''
      this.debugTrace(`${message}${contextStr}`)
      return
    }
    // Trace doesn't support context prefix pattern, only standard format
    const coloredMessage = this.formatColoredMessage(
      'trace',
      undefined,
      message,
    )
    this.logger.trace(context, coloredMessage)
  }

  private buildDebugMessage(
    contextPrefixOrMessage: string,
    messageOrData?: string | Record<string, unknown>,
    data?: Record<string, unknown>,
  ): string {
    if (typeof messageOrData === 'string') {
      const contextStr = data ? ` ${JSON.stringify(data)}` : ''
      return `[${contextPrefixOrMessage}] ${messageOrData}${contextStr}`
    }
    const contextStr = messageOrData ? ` ${JSON.stringify(messageOrData)}` : ''
    return `${contextPrefixOrMessage}${contextStr}`
  }

  createDebugLogger(key: string): debug.Debugger {
    if (!this.debugEnabled) {
      return debug(key)
    }

    let debugLogger = this.debugLoggers.get(key)
    if (!debugLogger) {
      debugLogger = debug(key)
      this.debugLoggers.set(key, debugLogger)
    }
    return debugLogger
  }

  enableDebugKey(key: string): void {
    this.debugKeys.add(key)
  }

  disableDebugKey(key: string): void {
    this.debugKeys.delete(key)
  }

  getActiveDebugKeys(): string[] {
    return Array.from(this.debugKeys)
  }

  userAction(
    action: string,
    userId?: string,
    context?: Record<string, unknown>,
  ): void {
    const color = this.colorManager.getLogTypeColor('userAction')
    const reset = this.colorManager.getResetColor()
    const coloredMessage = this.colorManager.config.enabled
      ? `${color}👤 User action: ${action}${reset}`
      : `👤 User action: ${action}`
    this.logger.info({ userId, ...context }, coloredMessage)
  }

  systemInfo(message: string, context?: Record<string, unknown>): void {
    const color = this.colorManager.getLogTypeColor('systemInfo')
    const reset = this.colorManager.getResetColor()
    const coloredMessage = this.colorManager.config.enabled
      ? `${color}⚙️ System: ${message}${reset}`
      : `⚙️ System: ${message}`
    this.logger.info(context, coloredMessage)
  }

  businessLogic(message: string, context?: Record<string, unknown>): void {
    const color = this.colorManager.getLogTypeColor('businessLogic')
    const reset = this.colorManager.getResetColor()
    const coloredMessage = this.colorManager.config.enabled
      ? `${color}💼 Business: ${message}${reset}`
      : `💼 Business: ${message}`
    this.logger.info(context, coloredMessage)
  }

  deprecatedFeature(
    feature: string,
    alternative?: string,
    context?: Record<string, unknown>,
  ): void {
    const color = this.colorManager.getLogTypeColor('deprecatedFeature')
    const reset = this.colorManager.getResetColor()
    const message = alternative
      ? `⚠️ Deprecated feature '${feature}' used. Consider using '${alternative}' instead.`
      : `⚠️ Deprecated feature '${feature}' used.`
    const coloredMessage = this.colorManager.config.enabled
      ? `${color}${message}${reset}`
      : message
    this.logger.warn(context, coloredMessage)
  }

  performanceWarning(message: string, metrics?: Record<string, unknown>): void {
    const color = this.colorManager.getLogTypeColor('performanceWarning')
    const reset = this.colorManager.getResetColor()
    const coloredMessage = this.colorManager.config.enabled
      ? `${color}🐌 Performance warning: ${message}${reset}`
      : `🐌 Performance warning: ${message}`
    this.logger.warn(metrics, coloredMessage)
  }

  securityWarning(message: string, context?: Record<string, unknown>): void {
    const color = this.colorManager.getLogTypeColor('securityWarning')
    const reset = this.colorManager.getResetColor()
    const coloredMessage = this.colorManager.config.enabled
      ? `${color}🔒 Security warning: ${message}${reset}`
      : `🔒 Security warning: ${message}`
    this.logger.warn(context, coloredMessage)
  }

  configurationWarning(
    message: string,
    context?: Record<string, unknown>,
  ): void {
    const color = this.colorManager.getLogTypeColor('configurationWarning')
    const reset = this.colorManager.getResetColor()
    const coloredMessage = this.colorManager.config.enabled
      ? `${color}⚙️ Configuration warning: ${message}${reset}`
      : `⚙️ Configuration warning: ${message}`
    this.logger.warn(context, coloredMessage)
  }

  validationError(
    message: string,
    field?: string,
    value?: unknown,
    context?: Record<string, unknown>,
  ): void {
    const color = this.colorManager.getLogTypeColor('validationError')
    const reset = this.colorManager.getResetColor()
    const coloredMessage = this.colorManager.config.enabled
      ? `${color}❌ Validation error: ${message}${reset}`
      : `❌ Validation error: ${message}`
    this.logger.error({ field, value, ...context }, coloredMessage)
  }

  databaseError(
    message: string,
    query?: string,
    context?: Record<string, unknown>,
  ): void {
    const color = this.colorManager.getLogTypeColor('databaseError')
    const reset = this.colorManager.getResetColor()
    const coloredMessage = this.colorManager.config.enabled
      ? `${color}🗄️ Database error: ${message}${reset}`
      : `🗄️ Database error: ${message}`
    this.logger.error({ query, ...context }, coloredMessage)
  }

  apiError(
    message: string,
    endpoint?: string,
    statusCode?: number,
    context?: Record<string, unknown>,
  ): void {
    const color = this.colorManager.getLogTypeColor('apiError')
    const reset = this.colorManager.getResetColor()
    const coloredMessage = this.colorManager.config.enabled
      ? `${color}🌐 API error: ${message}${reset}`
      : `🌐 API error: ${message}`
    this.logger.error({ endpoint, statusCode, ...context }, coloredMessage)
  }

  authenticationError(
    message: string,
    userId?: string,
    context?: Record<string, unknown>,
  ): void {
    const color = this.colorManager.getLogTypeColor('authenticationError')
    const reset = this.colorManager.getResetColor()
    const coloredMessage = this.colorManager.config.enabled
      ? `${color}🔐 Authentication error: ${message}${reset}`
      : `🔐 Authentication error: ${message}`
    this.logger.error({ userId, ...context }, coloredMessage)
  }

  systemError(
    message: string,
    component?: string,
    context?: Record<string, unknown>,
  ): void {
    const color = this.colorManager.getLogTypeColor('systemError')
    const reset = this.colorManager.getResetColor()
    const coloredMessage = this.colorManager.config.enabled
      ? `${color}💥 System error: ${message}${reset}`
      : `💥 System error: ${message}`
    this.logger.error({ component, ...context }, coloredMessage)
  }

  businessError(
    message: string,
    operation?: string,
    context?: Record<string, unknown>,
  ): void {
    const color = this.colorManager.getLogTypeColor('businessError')
    const reset = this.colorManager.getResetColor()
    const coloredMessage = this.colorManager.config.enabled
      ? `${color}💼 Business error: ${message}${reset}`
      : `💼 Business error: ${message}`
    this.logger.error({ operation, ...context }, coloredMessage)
  }
}
