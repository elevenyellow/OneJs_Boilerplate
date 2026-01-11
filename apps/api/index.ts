import { ContainerProvider, logger, OneJs, PluginRegistry } from '@OneJs'
import { BootstrapLoader } from '@OneJs/core/bootstrap/bootstrap-loader'
import { PrismaPlugin } from '@OneJs/prisma'
import { Server, ServerPlugin } from '@OneJs/server'
import cors from '@elysiajs/cors'

// Import bootstrap services to register them
// import './src/startup/world-scraper.bootstrap' // Disabled: Enable when needed

// Register plugins explicitly
PluginRegistry.register(new ServerPlugin())
PluginRegistry.register(new PrismaPlugin())
PluginRegistry.register(new BootstrapLoader())

const oneJs = new OneJs(import.meta.url)

await oneJs.start()
const container = ContainerProvider.getContainer()

const server = container.get(Server)

server
  .setPrefix('/api')
  .use(cors({ credentials: true }) as any)
  .start(Number(process.env.PORT ?? 4000), () => {
    logger.info('api:startup', 'Server started on port 4000')
  })
