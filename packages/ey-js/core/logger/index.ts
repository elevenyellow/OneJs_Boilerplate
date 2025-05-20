import pino, { type BaseLogger, type LoggerOptions, type Level } from 'pino'
import pretty from 'pino-pretty'
import { Injectable } from '../container'

@Injectable()
export class Logger {
  private readonly logger: BaseLogger

  constructor(level: Level = 'debug') {
    const transport = pretty({
      colorize: true,
      colorizeObjects: true,
    })

    const options: LoggerOptions = { level }
    this.logger = pino(options, transport)
  }

  info(message: string, context?: Record<string, unknown>) {
    this.logger.info(context, message)
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.logger.warn(context, message)
  }

  error(message: string, context?: Record<string, unknown>) {
    this.logger.error(context, message)
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.logger.debug(context, message)
  }

  trace(message: string, context?: Record<string, unknown>) {
    this.logger.trace(context, message)
  }
}

export const logger = new Logger()
