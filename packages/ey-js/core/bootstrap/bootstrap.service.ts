// packages/di/bootstrap/app-bootstrap.service.ts

import path from 'path'
import { fileURLToPath } from 'url'
import {
  container as defaultContainer,
  getAllEventHandlers,
} from '../container'
import { AutoLoader } from '../auto-loader'
import { metadataRegistry } from '../container/metadata-registry'
import type { Container } from '../container'
import { DomainEvent, EventBus } from '../event-bus'

interface BootstrapOptions {
  rootDir?: string
  extraDirs?: string[]
  container?: Container
  logger?: {
    debug?: (msg: string) => void
    info?: (msg: string) => void
    warn?: (msg: string) => void
    error?: (msg: string) => void
  }
}

export class BootstrapService {
  static async bootstrap(
    callerMetaUrl: string,
    options: BootstrapOptions = {},
  ): Promise<Container> {
    // 1. Resolver rootDir si no se dio
    const rootDir =
      options.rootDir || path.dirname(fileURLToPath(callerMetaUrl))

    const extraDirs = options.extraDirs ?? [
      path.resolve(process.cwd(), 'packages'),
    ]

    const container = options.container ?? defaultContainer
    const logger = options.logger ?? console

    // 2. Cargar archivos con AutoLoader
    logger.debug?.(`📦 Auto-loading files from: ${rootDir}`)
    AutoLoader.setContainer(container)
    await AutoLoader.init({ rootDir, extraDirs })

    // 3. Registrar servicios
    logger.debug?.('🔧 Registering injectable services...')
    for (const meta of metadataRegistry.getAllMetadata()) {
      container.register(
        meta.constructor,
        meta.scope,
        meta.autorun,
        meta.params,
      )
    }

    // 4. Registrar manejadores de eventos
    logger.debug?.('🧩 Registering event handlers...')

    const eventBus = container.get(EventBus)
    for (const {
      target,
      methodName,
      eventType,
      options,
    } of getAllEventHandlers()) {
      const handler = {
        handle: async (event: DomainEvent) => {
          const instance = container.get(target)
          return instance[methodName](event)
        },
      }

      eventBus.subscribe(eventType.name, handler, options)
    }

    logger.info?.('✅ App bootstrap complete.')

    for (const Service of container.getAllServicesWithAutorun()) {
      const instance = container.get(Service)

      if (typeof instance.autorun === 'function') {
        logger.debug?.(`⚙️  Autorun => ${Service.name}`)
        try {
          await instance.autorun()
        } catch (err) {
          logger.error?.(`❌ Autorun failed in ${Service.name}:`, err)
        }
      }
    }

    return container
  }
}
