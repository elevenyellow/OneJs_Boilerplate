import { Container, logger, metadataRegistry } from '../../core/src'
import type { BootstrapPlugin } from '../../core/src/bootstrap'
import { getAllControllers } from './controller-registry'
import { Server } from './http-server'

export class ServerPlugin implements BootstrapPlugin {
  name = 'server-plugin'
  priority = 70

  register(container: Container): void {
    // Remove the Server from automatic registration to prevent double registration
    // The Server will be registered explicitly by this plugin
    metadataRegistry.removeService(Server)

    // Explicitly register the Server class in the container
    container.registerClass(Server, { scope: 'singleton' })

    logger.debug(
      'oneJs:server',
      '📝 Server plugin registered - Server class registered in container',
    )
  }

  async load(container: Container): Promise<void> {
    const controllers = getAllControllers()

    if (controllers.length === 0) {
      logger.debug('oneJs:server', 'No controllers found')
      return
    }

    logger.debug(
      'oneJs:server',
      `🌐 Registering ${controllers.length} controller(s)...`,
    )

    const server = container.get(Server)
    server.addControllers(controllers)

    logger.debug('oneJs:server', '✅ Controllers registered')
  }
}
