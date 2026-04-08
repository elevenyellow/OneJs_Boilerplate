import {
  ContainerProvider,
  logger,
  OneJs,
  PluginRegistry
} from '@OneJs'
import { PrismaPlugin } from '@OneJs/prisma'
import { JobsPlugin } from '@OneJs/jobs'

// Register plugins
PluginRegistry.register(new PrismaPlugin())
PluginRegistry.register(new JobsPlugin())

const oneJs = new OneJs(import.meta.url)

await oneJs.start()

logger.info('worker:startup', 'Worker application started')

