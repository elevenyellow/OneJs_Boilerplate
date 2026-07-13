import { ConfigService } from '../config'
import type { Container } from '../container'
import { container as defaultContainer } from '../container'
import { ContainerProvider } from '../container/container-provider'
import { metadataRegistry } from '../container/metadata-registry'
import { logger } from '../logger'
import { BootstrapBase } from './bootstrap-base'
import type { BootstrapPlugin, Plugin } from './plugin-registry'
import { PluginRegistry } from './plugin-registry'
import { registerBootstrap } from './store'

const BOOTSTRAP_LOG_CONTEXT = 'oneJs:bootstrap'

export interface OneJsOptions {
  failFast?: boolean
}

export class OneJs {
  private readonly instancePlugins: Plugin[] = []

  constructor(
    private readonly container: Container = defaultContainer,
    private readonly options: OneJsOptions = {},
  ) {}

  use(plugin: Plugin): this {
    const alreadyRegistered = this.instancePlugins.some(
      (entry) => entry.name === plugin.name,
    )
    if (alreadyRegistered) {
      logger.warn(
        BOOTSTRAP_LOG_CONTEXT,
        `Plugin "${plugin.name}" is already registered on this kernel instance. Skipping.`,
      )
      return this
    }

    this.instancePlugins.push(plugin)
    return this
  }

  async start(): Promise<Container> {
    ContainerProvider.setContainer(this.container)

    this.registerServices()
    this.initConfigService()

    const plugins = this.resolvePlugins()
    await this.runPluginRegistration(plugins)
    await this.runPluginLoading(plugins)

    logger.debug(BOOTSTRAP_LOG_CONTEXT, '✅ OneJs initialization complete')

    return this.container
  }

  getContainer(): Container {
    return this.container
  }

  private registerServices(): void {
    logger.debug(BOOTSTRAP_LOG_CONTEXT, '🔧 Registering decorated services...')

    for (const meta of metadataRegistry.getAllMetadata()) {
      this.container.register(
        meta.constructor,
        meta.scope,
        meta.autorun,
        meta.params,
      )

      if (meta.constructor.prototype instanceof BootstrapBase) {
        registerBootstrap({ target: meta.constructor })
      }
    }

    logger.debug(
      BOOTSTRAP_LOG_CONTEXT,
      `✅ Registered ${metadataRegistry.getAllMetadata().length} services`,
    )
  }

  private initConfigService(): void {
    try {
      this.container.get(ConfigService)
    } catch {
      logger.warn(
        BOOTSTRAP_LOG_CONTEXT,
        'ConfigService not found or could not be initialized.',
      )
    }
  }

  private async runPluginRegistration(plugins: Plugin[]): Promise<void> {
    logger.debug(BOOTSTRAP_LOG_CONTEXT, '🔌 Registering plugins...')

    for (const plugin of plugins) {
      const bp = plugin as BootstrapPlugin
      if (!bp.register) continue
      try {
        logger.debug(
          BOOTSTRAP_LOG_CONTEXT,
          `📝 Registering plugin: ${plugin.name}`,
        )
        await bp.register(this.container)
      } catch (err) {
        const errorMessage = this.toErrorMessage(err)
        logger.error(
          BOOTSTRAP_LOG_CONTEXT,
          `❌ Error registering plugin "${plugin.name}": ${errorMessage}`,
        )

        if (this.shouldFailFast(plugin)) {
          throw new Error(
            `Kernel startup failed during plugin registration: ${plugin.name}. ${errorMessage}`,
          )
        }
      }
    }
  }

  private async runPluginLoading(plugins: Plugin[]): Promise<void> {
    logger.debug(BOOTSTRAP_LOG_CONTEXT, '⚡ Loading plugins...')

    for (const plugin of plugins) {
      const bp = plugin as BootstrapPlugin
      if (!bp.load) continue
      try {
        logger.debug(BOOTSTRAP_LOG_CONTEXT, `🚀 Loading plugin: ${plugin.name}`)
        await bp.load(this.container)
        // Re-register services after each plugin load. Some plugins (e.g.
        // auto-loader) import new files during load() which trigger decorators
        // that populate metadataRegistry after the initial registerServices()
        // call. container.register() is idempotent, so this is safe.
        this.registerServices()
      } catch (err) {
        const errorMessage = this.toErrorMessage(err)
        logger.error(
          BOOTSTRAP_LOG_CONTEXT,
          `❌ Error loading plugin "${plugin.name}": ${errorMessage}`,
        )

        if (this.shouldFailFast(plugin)) {
          throw new Error(
            `Kernel startup failed during plugin loading: ${plugin.name}. ${errorMessage}`,
          )
        }
      }
    }
  }

  private resolvePlugins(): Plugin[] {
    const legacyPlugins = PluginRegistry.getRegistered()
    PluginRegistry.clear()

    const merged = [...this.instancePlugins]
    for (const plugin of legacyPlugins) {
      const exists = merged.some((entry) => entry.name === plugin.name)
      if (!exists) {
        merged.push(plugin)
      }
    }

    return PluginRegistry.resolve(merged)
  }

  private shouldFailFast(plugin: Plugin): boolean {
    if (this.options.failFast === true) {
      return true
    }

    if (plugin.critical !== undefined) {
      return plugin.critical
    }

    return this.options.failFast ?? true
  }

  private toErrorMessage(err: unknown): string {
    if (err instanceof Error) {
      return err.message
    }

    return String(err)
  }
}
