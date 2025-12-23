import type { Container } from '../container'
import { logger } from '../logger'

/**
 * Interface that all bootstrap plugins must implement
 */
export interface BootstrapPlugin {
  /**
   * Unique name for the plugin
   */
  name: string

  /**
   * Priority for loading order (lower numbers load first)
   * Default: 100
   */
  priority?: number

  /**
   * Register services in the container (Phase 1)
   * Called before load() to allow plugins to register their services
   * @param container - The DI container instance
   */
  register?(container: Container): Promise<void> | void

  /**
   * Load and initialize the plugin (Phase 2)
   * Called after all plugins have registered their services
   * @param container - The DI container instance
   */
  load(container: Container): Promise<void> | void
}

/**
 * Registry for bootstrap plugins that need to process decorated classes
 */
export class PluginRegistry {
  private static plugins: BootstrapPlugin[] = []

  /**
   * Register a new bootstrap plugin
   */
  static register(plugin: BootstrapPlugin): void {
    // Check for duplicate names
    const existing = this.plugins.find((p) => p.name === plugin.name)
    if (existing) {
      logger.warn(
        'oneJs:plugin',
        `Plugin "${plugin.name}" is already registered. Skipping.`,
      )
      return
    }

    this.plugins.push(plugin)
    logger.debug('oneJs:plugin', `✅ Registered plugin: ${plugin.name}`)
  }

  /**
   * Get all registered plugins sorted by priority
   */
  static getAll(): BootstrapPlugin[] {
    return [...this.plugins].sort(
      (a, b) => (a.priority ?? 100) - (b.priority ?? 100),
    )
  }

  /**
   * Get a specific plugin by name
   */
  static get(name: string): BootstrapPlugin | undefined {
    return this.plugins.find((p) => p.name === name)
  }

  /**
   * Clear all registered plugins (useful for testing)
   */
  static clear(): void {
    this.plugins = []
  }

  /**
   * Check if a plugin is registered
   */
  static has(name: string): boolean {
    return this.plugins.some((p) => p.name === name)
  }
}
