// packages/di/bootstrap/app-bootstrap.service.ts

import path from 'path'
import { fileURLToPath } from 'url'
import type { Container } from '../container'
import { container as defaultContainer } from '../container'
import { ContainerProvider } from '../container/container-provider'
import { metadataRegistry } from '../container/metadata-registry'
import { logger } from '../logger'
import { AutoLoader } from './auto-loader'
import { BootstrapBase } from './bootstrap-base'
import { PluginRegistry } from './plugin-registry'
import { registerBootstrap } from './store'

interface BootstrapOptions {
  rootDir?: string
  extraDirs?: string[]
  container?: Container
}

export class OneJs {
  constructor(
    private readonly callerMetaUrl: string,
    private readonly container: Container = defaultContainer,
  ) {}

  async start(options: BootstrapOptions = {}) {
    // 1. Set container in provider for global access
    ContainerProvider.setContainer(this.container)

    // 2. Resolver rootDir si no se dio
    const rootDir =
      options.rootDir || path.dirname(fileURLToPath(this.callerMetaUrl))

    const extraDirs = options.extraDirs ?? [
      path.resolve(process.cwd(), 'packages'),
    ]

    // 3. Cargar archivos con AutoLoader
    logger.debug(`oneJs:bootstrap`, `📦 Auto-loading files from: ${rootDir}`)

    await AutoLoader.init({ rootDir, extraDirs })

    // 4. Registrar servicios en el contenedor
    logger.debug('oneJs:bootstrap', '🔧 Registering injectable services...')
    for (const meta of metadataRegistry.getAllMetadata()) {
      // Register classes extending BootstrapBase for the bootstrap loader
      if (meta.constructor.prototype instanceof BootstrapBase) {
        registerBootstrap({ target: meta.constructor })
      }

      this.container.register(
        meta.constructor,
        meta.scope,
        meta.autorun,
        meta.params,
      )
    }

    // 5. PHASE 1: Plugin Registration
    logger.debug('oneJs:bootstrap', '🔌 Registering plugins...')
    const plugins = PluginRegistry.getAll()

    for (const plugin of plugins) {
      try {
        if (plugin.register) {
          logger.debug(
            'oneJs:bootstrap',
            `📝 Registering plugin: ${plugin.name}`,
          )
          await plugin.register(this.container)
        }
      } catch (err) {
        logger.error?.(
          'oneJs:bootstrap',
          `❌ Error registering plugin "${plugin.name}": ${err}`,
        )
      }
    }

    // 6. PHASE 2: Plugin Loading
    logger.debug('oneJs:bootstrap', '⚡ Loading plugins...')
    for (const plugin of plugins) {
      try {
        logger.debug('oneJs:bootstrap', `🚀 Loading plugin: ${plugin.name}`)
        await plugin.load(this.container)
      } catch (err) {
        logger.error?.(
          'oneJs:bootstrap',
          `❌ Error loading plugin "${plugin.name}": ${err}`,
        )
      }
    }

    logger.debug('oneJs:bootstrap', '✅ OneJs initialization complete')
  }

  getContainer(): Container {
    return this.container
  }
}
