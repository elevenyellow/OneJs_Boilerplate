import { BootstrapService, Server } from '@EyJs'
import { swagger } from '@elysiajs/swagger'
import { cors } from '@elysiajs/cors'

const container = await BootstrapService.bootstrap(import.meta.url)

const server = container.get(Server)
server
  .use(cors({ credentials: true }))
  .use(
    swagger({
      path: '/docs',
      documentation: {
        info: { title: 'EyJs Boilerplate API', version: '1.0.0' },
      },
    }),
  )
  .setPrefix('/api')
  .setContainer(container)
  .start(4000)
