// packages/di/bootstrap/app-bootstrap.service.ts

import path from 'path'
import { fileURLToPath } from 'url'
import type { Container } from '../container'
import { container as defaultContainer } from '../container'
import { metadataRegistry } from '../container/metadata-registry'
import { logger } from '../logger'
import { AutoLoader } from './auto-loader'
import { BootstrapBase } from './bootstrap-base'
import { getAllBootstraps, registerBootstrap } from './store'

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
    // 1. Resolver rootDir si no se dio
    const rootDir =
      options.rootDir || path.dirname(fileURLToPath(this.callerMetaUrl))

    const extraDirs = options.extraDirs ?? [
      path.resolve(process.cwd(), 'packages'),
    ]

    // 2. Cargar archivos con AutoLoader
    logger.debug(`oneJs:bootstrap`, `📦 Auto-loading files from: ${rootDir}`)

    await AutoLoader.init({ rootDir, extraDirs })

    // 3. Registrar servicios
    logger.debug('oneJs:bootstrap', '🔧 Registering injectable services...')
    for (const meta of metadataRegistry.getAllMetadata()) {
      // register as autorun service
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

    // startup services
    for (const meta of getAllBootstraps()) {
      const instance = this.container.get(meta.target)

      if (
        instance instanceof BootstrapBase &&
        typeof instance.bootstrap === 'function'
      ) {
        try {
          await instance.bootstrap()
        } catch (err) {
          logger.error?.(`❌ Error in ${meta.target.name}.bootstrap(): ${err}`)
        }
      }
    }
  }

  getContainer(): Container {
    return this.container
  }
}
