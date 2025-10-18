// Core exports only
export { OneJs, PluginRegistry, type BootstrapPlugin } from './bootstrap'
export { ConfigService } from './config'
export {
  Container,
  ContainerProvider,
  Inject,
  Injectable,
  metadataRegistry,
} from './container'
export * from './errors'
export { Logger, logger } from './logger'
export type { ClassConstructor } from './types'

// Auth exports (core feature)
export { AuthMiddleware } from './auth.middleware'
export { UseAuth } from './decorators/use-middleware'

// Prisma exports (core feature)
export { PrismaClientEy } from './prisma-client'
export { PrismaRepository } from './repositories/base.repository'
