import { ContainerProvider, logger, OneJs, PluginRegistry } from '@OneJs'
import { EventBusPlugin } from '@OneJs/event-bus'
import { PrismaPlugin } from '@OneJs/prisma'
import { ScrapeCragCommand } from './commands/scrape-crag'

PluginRegistry.register(new PrismaPlugin())
PluginRegistry.register(new EventBusPlugin())

const oneJs = new OneJs(import.meta.url)

await oneJs.start()
const container = ContainerProvider.getContainer()

const command = process.argv[2]
const args = process.argv.slice(3)

if (!command) {
  logger.error('cli:params', 'No command provided')
  logger.info('cli:help', 'Usage: bun apps/cli/index.ts <command> [args]')
  logger.info('cli:help', 'Commands:')
  logger.info(
    'cli:help',
    '  scrape-crag <crag-url>  - Scrape a crag from the-crag.com',
  )
  process.exit(1)
}

const commands = [
  {
    name: 'scrape-crag',
    description: 'Scrape a crag from the-crag.com',
    action: async () => {
      await container.get(ScrapeCragCommand).execute(args)
    },
  },
]

const c = commands.find((c) => c.name === command)

if (!c) {
  logger.error('cli:command', `Command ${command} not found`)
  process.exit(1)
}

await c.action()
