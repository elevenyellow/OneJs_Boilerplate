// src/auto-logger.ts
import { getConfigFromEnv } from './env-config'
import { Logger } from './logger'

// Logger automático que lee desde .env
export const autoLogger = new Logger(getConfigFromEnv())

// Función para crear logger con auto-config
export function createAutoLogger(overrides = {}) {
  const envConfig = getConfigFromEnv()
  return new Logger({ ...envConfig, ...overrides })
}
