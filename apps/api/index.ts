import { OneJs, Server } from '@OneJs'
import cors from '@elysiajs/cors'

const oneJs = new OneJs(import.meta.url)

await oneJs.start()
const container = oneJs.getContainer()

const server = container.get(Server)

server
  .use(cors({ credentials: true }))
  .setPrefix('/api')
  .setContainer(container)
  .start(4000)
