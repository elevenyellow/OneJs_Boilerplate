import type { ColorConfig, ColorTheme } from './logger-config.interface'

// Predefined color themes
export const COLOR_THEMES: Record<ColorTheme, ColorConfig> = {
  default: {
    levels: {
      trace: '\x1b[90m',
      debug: '\x1b[36m',
      info: '\x1b[32m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
      fatal: '\x1b[35m',
    },
    debugKeys: {
      'eyjslogger:database': '\x1b[36m',
      'eyjslogger:api': '\x1b[32m',
      'eyjslogger:auth': '\x1b[33m',
      'eyjslogger:cache': '\x1b[35m',
      'eyjslogger:validation': '\x1b[31m',
      'eyjslogger:performance': '\x1b[90m',
    },
    logTypes: {
      userAction: '\x1b[94m',
      systemInfo: '\x1b[96m',
      businessLogic: '\x1b[95m',
      deprecatedFeature: '\x1b[93m',
      performanceWarning: '\x1b[91m',
      securityWarning: '\x1b[91m',
      configurationWarning: '\x1b[93m',
      validationError: '\x1b[91m',
      databaseError: '\x1b[91m',
      apiError: '\x1b[91m',
      authenticationError: '\x1b[91m',
      systemError: '\x1b[91m',
      businessError: '\x1b[91m',
    },
    resetColor: '\x1b[0m',
    enabled: true,
  },

  dark: {
    levels: {
      trace: '\x1b[37m',
      debug: '\x1b[36m',
      info: '\x1b[32m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
      fatal: '\x1b[35m',
    },
    debugKeys: {
      'eyjslogger:database': '\x1b[36m',
      'eyjslogger:api': '\x1b[32m',
      'eyjslogger:auth': '\x1b[33m',
      'eyjslogger:cache': '\x1b[35m',
      'eyjslogger:validation': '\x1b[31m',
      'eyjslogger:performance': '\x1b[37m',
    },
    resetColor: '\x1b[0m',
    enabled: true,
  },

  light: {
    levels: {
      trace: '\x1b[90m',
      debug: '\x1b[36m',
      info: '\x1b[32m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
      fatal: '\x1b[35m',
    },
    debugKeys: {
      'eyjslogger:database': '\x1b[36m',
      'eyjslogger:api': '\x1b[32m',
      'eyjslogger:auth': '\x1b[33m',
      'eyjslogger:cache': '\x1b[35m',
      'eyjslogger:validation': '\x1b[31m',
      'eyjslogger:performance': '\x1b[90m',
    },
    resetColor: '\x1b[0m',
    enabled: true,
  },

  minimal: {
    levels: {
      trace: '\x1b[90m',
      debug: '\x1b[90m',
      info: '\x1b[37m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
      fatal: '\x1b[31m',
    },
    debugKeys: {
      'eyjslogger:database': '\x1b[90m',
      'eyjslogger:api': '\x1b[90m',
      'eyjslogger:auth': '\x1b[90m',
      'eyjslogger:cache': '\x1b[90m',
      'eyjslogger:validation': '\x1b[90m',
      'eyjslogger:performance': '\x1b[90m',
    },
    resetColor: '\x1b[0m',
    enabled: true,
  },

  rainbow: {
    levels: {
      trace: '\x1b[35m',
      debug: '\x1b[36m',
      info: '\x1b[32m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
      fatal: '\x1b[91m',
    },
    debugKeys: {
      'eyjslogger:database': '\x1b[36m',
      'eyjslogger:api': '\x1b[32m',
      'eyjslogger:auth': '\x1b[33m',
      'eyjslogger:cache': '\x1b[35m',
      'eyjslogger:validation': '\x1b[31m',
      'eyjslogger:performance': '\x1b[94m',
    },
    logTypes: {
      userAction: '\x1b[94m',
      systemInfo: '\x1b[96m',
      businessLogic: '\x1b[95m',
      deprecatedFeature: '\x1b[93m',
      performanceWarning: '\x1b[91m',
      securityWarning: '\x1b[91m',
      configurationWarning: '\x1b[93m',
      validationError: '\x1b[91m',
      databaseError: '\x1b[91m',
      apiError: '\x1b[91m',
      authenticationError: '\x1b[91m',
      systemError: '\x1b[91m',
      businessError: '\x1b[91m',
    },
    resetColor: '\x1b[0m',
    enabled: true,
  },
}

export class ColorManager {
  public config: ColorConfig

  constructor(config: ColorConfig = {}) {
    this.config = this.mergeWithTheme(config)
  }

  private mergeWithTheme(config: ColorConfig): ColorConfig {
    const theme = config.theme || 'default'
    const themeConfig = COLOR_THEMES[theme]

    return {
      ...themeConfig,
      ...config,
      levels: { ...themeConfig.levels, ...config.levels },
      debugKeys: { ...themeConfig.debugKeys, ...config.debugKeys },
      logTypes: { ...themeConfig.logTypes, ...config.logTypes },
    }
  }

  getLevelColor(level: string): string {
    if (!this.config.enabled) return ''

    const levelMap: Record<string, string> = {
      trace: this.config.levels?.trace || '',
      debug: this.config.levels?.debug || '',
      info: this.config.levels?.info || '',
      warn: this.config.levels?.warn || '',
      error: this.config.levels?.error || '',
      fatal: this.config.levels?.fatal || '',
      TRACE: this.config.levels?.trace || '',
      DEBUG: this.config.levels?.debug || '',
      INFO: this.config.levels?.info || '',
      WARN: this.config.levels?.warn || '',
      ERROR: this.config.levels?.error || '',
      FATAL: this.config.levels?.fatal || '',
    }

    return levelMap[level] || ''
  }

  getDebugKeyColor(key: string): string {
    if (!this.config.enabled) return ''
    return this.config.debugKeys?.[key] || ''
  }

  getLogTypeColor(type: string): string {
    if (!this.config.enabled) return ''
    return (this.config.logTypes as Record<string, string>)?.[type] || ''
  }

  getResetColor(): string {
    return this.config.resetColor || '\x1b[0m'
  }

  addCustomColors(customColors: Partial<ColorConfig>): void {
    this.config = this.mergeWithTheme({ ...this.config, ...customColors })
  }

  disableColors(): void {
    this.config.enabled = false
  }

  enableColors(): void {
    this.config.enabled = true
  }
}
