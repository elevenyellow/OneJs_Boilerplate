import { ContainerProvider, logger, OneJs, PluginRegistry } from '@OneJs'
import { EventBusPlugin } from '@OneJs/event-bus'
import { PrismaPlugin } from '@OneJs/prisma'
import { Server, ServerPlugin } from '@OneJs/server'
import { AuthPlugin } from './src/auth/auth-plugin'
// import cors from '@elysiajs/cors'

// Register plugins explicitly

PluginRegistry.register(new ServerPlugin())
PluginRegistry.register(new PrismaPlugin())
PluginRegistry.register(new EventBusPlugin())
PluginRegistry.register(new AuthPlugin())

const oneJs = new OneJs(import.meta.url)

await oneJs.start()
const container = ContainerProvider.getContainer()

const server = container.get(Server)

server
  .setPrefix('/api')
  // .use(cors({ credentials: true }) as any)
  .start(4000, () => {
    logger.info('api:startup', 'Server started on port 4000')
  })
