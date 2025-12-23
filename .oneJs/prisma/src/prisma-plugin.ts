import { type Container, logger } from '../../core/src'
import type { BootstrapPlugin } from '../../core/src'
import { PrismaClientOneJs } from './services/prisma-client'

export class PrismaPlugin implements BootstrapPlugin {
  name = 'prisma-plugin'
  priority = 50 // Prisma should start before the server (70)

  async register(container: Container): Promise<void> {
    // Register PrismaClientOneJs as a singleton
    container.registerClass(PrismaClientOneJs, { scope: 'singleton' })

    logger.debug(
      'oneJs:prisma',
      '📝 Prisma plugin registered - PrismaClientOneJs registered in container',
    )
  }

  async load(container: Container): Promise<void> {
    const prisma = container.get(PrismaClientOneJs)
    try {
      logger.debug('oneJs:prisma', '🔌 Connecting to database...')
      await prisma.$connect()
      logger.debug('oneJs:prisma', '✅ Database connected successfully')
    } catch (err) {
      logger.error?.(
        'oneJs:prisma',
        `❌ Error connecting to database: ${err}`,
      )
      throw err
    }
  }
}

