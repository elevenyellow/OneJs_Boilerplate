import { ContainerProvider, logger, OneJs, PluginRegistry } from '@OneJs'
import { BootstrapLoader } from '@OneJs/core/bootstrap/bootstrap-loader'
import { JobsPlugin } from '@OneJs/jobs'
import { PrismaPlugin } from '@OneJs/prisma'
import { Server, ServerPlugin } from '@OneJs/server'
import cors from '@elysiajs/cors'

// Import jobs so they get registered
import '@scraper-thecrag/infrastructure/jobs/scrape-country.job'

// Register plugins explicitly
PluginRegistry.register(new ServerPlugin())
PluginRegistry.register(new PrismaPlugin())
PluginRegistry.register(new JobsPlugin())
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
