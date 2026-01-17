import {
  ContainerProvider,
  logger,
  OneJs,
  PluginRegistry
} from '@OneJs'
import { Server, ServerPlugin } from '@OneJs/server'
import { PrismaPlugin } from '@OneJs/prisma'
import cors from '@elysiajs/cors'

// Register plugins explicitly

PluginRegistry.register(new ServerPlugin())
PluginRegistry.register(new PrismaPlugin())
// PluginRegistry.register(new EventBusPlugin())
// PluginRegistry.register(new JobsPlugin())

const oneJs = new OneJs(import.meta.url)

await oneJs.start()
const container = ContainerProvider.getContainer()

const server = container.get(Server)


server
  .setPrefix('/api')
  .use(cors({ credentials: true }) as any)
  .start(4000, () => {
    logger.info('api:startup', 'Server started on port 4000')
  })

