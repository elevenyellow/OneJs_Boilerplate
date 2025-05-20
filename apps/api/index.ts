import { BootstrapService, Server } from '@EyJs'

const container = await BootstrapService.bootstrap(import.meta.url)

const server = container.get(Server)
server.setContainer(container).start(4000)
