import {
  ContainerProvider,
  OneJs,
  PluginRegistry,
} from '../../.oneJs/core/src/index.ts'
import { Server, ServerPlugin } from '../../.oneJs/server/src/index.ts'

// Register plugins explicitly
PluginRegistry.register(new ServerPlugin())
// PluginRegistry.register(new EventBusPlugin())
// PluginRegistry.register(new JobsPlugin())

const oneJs = new OneJs(import.meta.url)

await oneJs.start()
const container = ContainerProvider.getContainer()

const server = container.get(Server)

server
  // .use(cors({ credentials: true }))
  .setPrefix('/api')
  .start(4000)
