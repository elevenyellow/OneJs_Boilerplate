import { BootstrapService, Server } from '@EyJs'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'

const container = await BootstrapService.bootstrap(import.meta.url)

const server = container.get(Server)
server
  .addMiddleware(
    cors({
      credentials: true,
    }),
  )
  .addMiddleware(
    swagger({
      path: '/docs',
      documentation: {
        info: {
          title: 'EyJs Boilerplate API',
          version: '1.0.0',
        },
      },
    }),
  )
  .setPrefix('/api')
  .setContainer(container)
  .start(4000)
