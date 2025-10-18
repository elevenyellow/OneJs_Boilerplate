import debug from 'debug'
import pino, { type BaseLogger, type LoggerOptions } from 'pino'
import pretty from 'pino-pretty'
import { Injectable } from '../../container/decorators'
import { ColorManager } from './color-themes'
import { getConfigFromEnv, mergeConfig } from './env-config'
import { type LoggerConfig } from './logger-config.interface'
import { type ExtensibleLogger } from './logger.interface'

@Injectable()
export class Logger implements ExtensibleLogger {
  private readonly logger: BaseLogger
  private readonly debugEnabled: boolean
  private readonly debugKeys: Set<string>
  private readonly debugLoggers: Map<string, debug.Debugger> = new Map()
  private readonly colorManager: ColorManager

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
      serviceName = 'eyjs-logger',
      colors = {},
    } = finalConfig

    this.debugEnabled = enableDebug
    this.debugKeys = new Set(debugKeys)
    this.colorManager = new ColorManager(colors)

    // Configure transport for Pino - simplified without custom colors
    const transportOptions: Record<string, unknown> = {
      colorize: false, // Disable Pino's colors
      colorizeObjects: false,
      // Simple format without custom prettifiers
      messageFormat: (log: any, messageKey: string) => {
        return log[messageKey]
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
      level,
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
    this.colorManager.addCustomColors({ theme: theme as any })
  }

  addCustomColors(customColors: any): void {
    this.colorManager.addCustomColors(customColors)
  }

  disableColors(): void {
    this.colorManager.disableColors()
  }

  enableColors(): void {
    this.colorManager.enableColors()
  }

  info(key: string, message: string, context?: Record<string, unknown>): void {
    const color = this.colorManager.getLevelColor('info')
    const reset = this.colorManager.getResetColor()
    const formattedMessage = `[${key}] ${message}`
    const coloredMessage = this.colorManager.config.enabled
      ? `${color}${formattedMessage}${reset}`
      : formattedMessage
    this.logger.info(context, coloredMessage)
  }

  warn(key: string, message: string, context?: Record<string, unknown>): void {
    const color = this.colorManager.getLevelColor('warn')
    const reset = this.colorManager.getResetColor()
    const formattedMessage = `[${key}] ${message}`
    const coloredMessage = this.colorManager.config.enabled
      ? `${color}${formattedMessage}${reset}`
      : formattedMessage
    this.logger.warn(context, coloredMessage)
  }

  error(key: string, message: string, context?: Record<string, unknown>): void {
    const color = this.colorManager.getLevelColor('error')
    const reset = this.colorManager.getResetColor()
    const formattedMessage = `[${key}] ${message}`
    const coloredMessage = this.colorManager.config.enabled
      ? `${color}${formattedMessage}${reset}`
      : formattedMessage
    this.logger.error(context, coloredMessage)
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

  trace(key: string, message: string, context?: Record<string, unknown>): void {
    const color = this.colorManager.getLevelColor('trace')
    const reset = this.colorManager.getResetColor()
    const formattedMessage = `[${key}] ${message}`
    const coloredMessage = this.colorManager.config.enabled
      ? `${color}${formattedMessage}${reset}`
      : formattedMessage
    this.logger.trace(context, coloredMessage)
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
    key: string,
    action: string,
    userId?: string,
    context?: Record<string, unknown>,
  ): void {
    const color = this.colorManager.getLogTypeColor('userAction')
    const reset = this.colorManager.getResetColor()
    const formattedMessage = `[${key}] 👤 User action: ${action}`
    const coloredMessage = this.colorManager.config.enabled
      ? `${color}${formattedMessage}${reset}`
      : formattedMessage
    this.logger.info({ userId, ...context }, coloredMessage)
  }

  systemInfo(
    key: string,
    message: string,
    context?: Record<string, unknown>,
  ): void {
    const color = this.colorManager.getLogTypeColor('systemInfo')
    const reset = this.colorManager.getResetColor()
    const formattedMessage = `[${key}] ⚙️ System: ${message}`
    const coloredMessage = this.colorManager.config.enabled
      ? `${color}${formattedMessage}${reset}`
      : formattedMessage
    this.logger.info(context, coloredMessage)
  }

  businessLogic(
    key: string,
    message: string,
    context?: Record<string, unknown>,
  ): void {
    const color = this.colorManager.getLogTypeColor('businessLogic')
    const reset = this.colorManager.getResetColor()
    const formattedMessage = `[${key}] 💼 Business: ${message}`
    const coloredMessage = this.colorManager.config.enabled
      ? `${color}${formattedMessage}${reset}`
      : formattedMessage
    this.logger.info(context, coloredMessage)
  }

  deprecatedFeature(
    key: string,
    feature: string,
    alternative?: string,
    context?: Record<string, unknown>,
  ): void {
    const color = this.colorManager.getLogTypeColor('deprecatedFeature')
    const reset = this.colorManager.getResetColor()
    const message = alternative
      ? `[${key}] ⚠️ Deprecated feature '${feature}' used. Consider using '${alternative}' instead.`
      : `[${key}] ⚠️ Deprecated feature '${feature}' used.`
    const coloredMessage = this.colorManager.config.enabled
      ? `${color}${message}${reset}`
      : message
    this.logger.warn(context, coloredMessage)
  }

  performanceWarning(
    key: string,
    message: string,
    metrics?: Record<string, unknown>,
  ): void {
    const color = this.colorManager.getLogTypeColor('performanceWarning')
    const reset = this.colorManager.getResetColor()
    const formattedMessage = `[${key}] 🐌 Performance warning: ${message}`
    const coloredMessage = this.colorManager.config.enabled
      ? `${color}${formattedMessage}${reset}`
      : formattedMessage
    this.logger.warn(metrics, coloredMessage)
  }

  securityWarning(
    key: string,
    message: string,
    context?: Record<string, unknown>,
  ): void {
    const color = this.colorManager.getLogTypeColor('securityWarning')
    const reset = this.colorManager.getResetColor()
    const formattedMessage = `[${key}] 🔒 Security warning: ${message}`
    const coloredMessage = this.colorManager.config.enabled
      ? `${color}${formattedMessage}${reset}`
      : formattedMessage
    this.logger.warn(context, coloredMessage)
  }

  configurationWarning(
    key: string,
    message: string,
    context?: Record<string, unknown>,
  ): void {
    const color = this.colorManager.getLogTypeColor('configurationWarning')
    const reset = this.colorManager.getResetColor()
    const formattedMessage = `[${key}] ⚙️ Configuration warning: ${message}`
    const coloredMessage = this.colorManager.config.enabled
      ? `${color}${formattedMessage}${reset}`
      : formattedMessage
    this.logger.warn(context, coloredMessage)
  }

  validationError(
    key: string,
    message: string,
    field?: string,
    value?: unknown,
    context?: Record<string, unknown>,
  ): void {
    const color = this.colorManager.getLogTypeColor('validationError')
    const reset = this.colorManager.getResetColor()
    const formattedMessage = `[${key}] ❌ Validation error: ${message}`
    const coloredMessage = this.colorManager.config.enabled
      ? `${color}${formattedMessage}${reset}`
      : formattedMessage
    this.logger.error({ field, value, ...context }, coloredMessage)
  }

  databaseError(
    key: string,
    message: string,
    query?: string,
    context?: Record<string, unknown>,
  ): void {
    const color = this.colorManager.getLogTypeColor('databaseError')
    const reset = this.colorManager.getResetColor()
    const formattedMessage = `[${key}] 🗄️ Database error: ${message}`
    const coloredMessage = this.colorManager.config.enabled
      ? `${color}${formattedMessage}${reset}`
      : formattedMessage
    this.logger.error({ query, ...context }, coloredMessage)
  }

  apiError(
    key: string,
    message: string,
    endpoint?: string,
    statusCode?: number,
    context?: Record<string, unknown>,
  ): void {
    const color = this.colorManager.getLogTypeColor('apiError')
    const reset = this.colorManager.getResetColor()
    const formattedMessage = `[${key}] 🌐 API error: ${message}`
    const coloredMessage = this.colorManager.config.enabled
      ? `${color}${formattedMessage}${reset}`
      : formattedMessage
    this.logger.error({ endpoint, statusCode, ...context }, coloredMessage)
  }

  authenticationError(
    key: string,
    message: string,
    userId?: string,
    context?: Record<string, unknown>,
  ): void {
    const color = this.colorManager.getLogTypeColor('authenticationError')
    const reset = this.colorManager.getResetColor()
    const formattedMessage = `[${key}] 🔐 Authentication error: ${message}`
    const coloredMessage = this.colorManager.config.enabled
      ? `${color}${formattedMessage}${reset}`
      : formattedMessage
    this.logger.error({ userId, ...context }, coloredMessage)
  }

  systemError(
    key: string,
    message: string,
    component?: string,
    context?: Record<string, unknown>,
  ): void {
    const color = this.colorManager.getLogTypeColor('systemError')
    const reset = this.colorManager.getResetColor()
    const formattedMessage = `[${key}] 💥 System error: ${message}`
    const coloredMessage = this.colorManager.config.enabled
      ? `${color}${formattedMessage}${reset}`
      : formattedMessage
    this.logger.error({ component, ...context }, coloredMessage)
  }

  businessError(
    key: string,
    message: string,
    operation?: string,
    context?: Record<string, unknown>,
  ): void {
    const color = this.colorManager.getLogTypeColor('businessError')
    const reset = this.colorManager.getResetColor()
    const formattedMessage = `[${key}] 💼 Business error: ${message}`
    const coloredMessage = this.colorManager.config.enabled
      ? `${color}${formattedMessage}${reset}`
      : formattedMessage
    this.logger.error({ operation, ...context }, coloredMessage)
  }
}
