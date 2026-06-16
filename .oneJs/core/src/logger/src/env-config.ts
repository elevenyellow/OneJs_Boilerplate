// src/env-config.ts
import { createRequire } from 'module'
import { type LoggerConfig } from './logger-config.interface'

let dotenvLoaded = false

function loadDotenv(): void {
  if (dotenvLoaded) return
  try {
    const requireFn = createRequire(import.meta.url)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
    const dotenv: any = requireFn('dotenv')
    if (dotenv && typeof dotenv.config === 'function') {
      dotenv.config()
    }
  } catch {
    // dotenv not installed or not resolvable; skip silently
  }
  dotenvLoaded = true
}

export function getConfigFromEnv(): Partial<LoggerConfig> {
  loadDotenv()

  const level = process.env['LOG_LEVEL'] as any as
    | LoggerConfig['level']
    | undefined
  const enableDebug = process.env['LOG_DEBUG'] === 'true' ? true : undefined
  const debugKeys = process.env['LOG_DEBUG_KEYS']
    ? process.env['LOG_DEBUG_KEYS']!.split(',').filter(Boolean)
    : undefined
  const serverUrl = process.env['LOG_SERVER_URL'] || undefined
  const serviceName = process.env['SERVICE_NAME'] || undefined
  const theme = (process.env['LOG_THEME'] as any) || undefined
  const colorsEnabled =
    process.env['LOG_COLORS'] === undefined
      ? undefined
      : process.env['LOG_COLORS'] !== 'false'

  return {
    level,
    enableDebug,
    debugKeys,
    serverUrl,
    serviceName,
    colors: {
      theme,
      enabled: colorsEnabled,
    },
  }
}

export function mergeConfig(
  envConfig: Partial<LoggerConfig>,
  userConfig: LoggerConfig,
): LoggerConfig {
  return {
    level: userConfig.level ?? envConfig.level!,
    enableDebug:
      userConfig.enableDebug ??
      (envConfig.enableDebug as boolean | undefined) ??
      true,
    debugKeys: userConfig.debugKeys ?? envConfig.debugKeys ?? [],
    serverUrl: userConfig.serverUrl ?? envConfig.serverUrl,
    serviceName: userConfig.serviceName ?? envConfig.serviceName,
    colors: {
      ...(envConfig.colors || {}),
      ...(userConfig.colors || {}),
    },
  }
}
