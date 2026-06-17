import { AuthPlugin, ClerkStrategy } from '@OneJs/auth'
import { logger, OneJs } from '@OneJs/core'
import { AutoLoaderPlugin, BootstrapLoader } from '@OneJs/core/bootstrap'
import { EventBusPlugin } from '@OneJs/event-bus'
import { type AnyMiddleware, Server, ServerPlugin } from '@OneJs/server'
import cors from '@elysiajs/cors'

const container = await new OneJs()
  .use(new AutoLoaderPlugin({ rootDir: import.meta.dir }))
  .use(new BootstrapLoader())
  .use(new AuthPlugin(ClerkStrategy))
  .use(new ServerPlugin())
  .use(new EventBusPlugin())
  .start()

const port = Number(process.env.PORT ?? 4000)

container
  .get(Server)
  .setPrefix('/api')
  .use(cors({ credentials: true }) as unknown as AnyMiddleware)
  .start(port, () => {
    logger.info('api:startup', `Server started on port ${port}`)
  })
